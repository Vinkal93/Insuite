import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Layers,
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { SchoolClass } from "@/types";
import { feeStructureSchema, type FeeStructureInput } from "@/schemas/fees";
import { createFeeStructure } from "@/services/feeService";
import { getSchoolClasses } from "@/services/academicService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_COMPONENTS = [
  { id: "tuition", name: "Tuition Fee", amount: 3500, frequency: "Monthly" as const, isMandatory: true, description: "Monthly academic instruction fee" },
  { id: "admission", name: "Admission / Annual Fee", amount: 5000, frequency: "Yearly" as const, isMandatory: true, description: "Annual registration & development charge" },
  { id: "exam", name: "Examination Fee", amount: 1200, frequency: "Half-Yearly" as const, isMandatory: true, description: "Term examination & assessment fee" },
  { id: "computer", name: "Computer & Lab Fee", amount: 600, frequency: "Monthly" as const, isMandatory: false, description: "IT infrastructure & science lab fee" },
];

export const CreateFeeStructureView: React.FC = () => {
  const { organization, selectedSession, allSessions, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<FeeStructureInput>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: "",
      academicSessionId: selectedSession?.id || "",
      classId: "",
      frequency: "Monthly",
      components: DEFAULT_COMPONENTS,
      status: "ACTIVE",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  useEffect(() => {
    if (!organization) return;
    getSchoolClasses(organization.id, selectedSession?.id).then((cls) => {
      setClasses(cls);
      if (cls.length > 0 && !form.getValues("classId")) {
        form.setValue("classId", cls[0].id);
      }
    });
  }, [organization, selectedSession]);

  const watchedComponents = form.watch("components") || [];
  const totalAmount = watchedComponents.reduce(
    (sum, c) => sum + (Number(c?.amount) || 0),
    0
  );

  const onSubmit = async (data: FeeStructureInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createFeeStructure(organization.id, data, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Admin",
      });
      navigate({
        to: "/fees/structure/$structureId",
        params: { structureId: created.id },
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create fee structure.");
      setIsSubmitting(false);
    }
  };

  const addCustomComponent = () => {
    append({
      id: `custom_${Date.now()}`,
      name: "",
      amount: 0,
      frequency: form.getValues("frequency") || "Monthly",
      isMandatory: true,
      description: "",
    });
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="rounded-xl size-9">
          <Link to="/fees/structure">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Create Fee Structure
          </h1>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Set up fee components, amounts, and billing frequencies for a specific grade level.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Structure Details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
            1. Structure Scope & Target Grade
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Structure Name *</Label>
              <Input
                {...form.register("name")}
                placeholder="e.g., Class 10 Standard Fee Structure 2026-27"
                className="rounded-xl text-xs"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic Session *</Label>
              <select
                {...form.register("academicSessionId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {allSessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class Grade *</Label>
              <select
                {...form.register("classId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Primary Billing Frequency *</Label>
              <select
                {...form.register("frequency")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Half-Yearly">Half-Yearly</option>
                <option value="Yearly">Yearly</option>
                <option value="One-Time">One-Time</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Fee Components Builder */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                2. Fee Components Breakdown
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Itemize tuition, lab, library, sports, and other charges.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomComponent}
              className="rounded-xl text-xs font-semibold"
            >
              <Plus className="size-3.5 mr-1" /> Add Component
            </Button>
          </div>

          <div className="space-y-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-2xl border border-border bg-surface p-3"
              >
                <div className="flex-1 w-full sm:w-auto">
                  <Input
                    {...form.register(`components.${index}.name`)}
                    placeholder="Component Name (e.g. Tuition Fee)"
                    className="rounded-xl text-xs font-semibold"
                  />
                </div>

                <div className="w-full sm:w-36">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">₹</span>
                    <Input
                      type="number"
                      min={0}
                      {...form.register(`components.${index}.amount`)}
                      placeholder="Amount"
                      className="pl-7 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="w-full sm:w-36">
                  <select
                    {...form.register(`components.${index}.frequency`)}
                    className="w-full rounded-xl border border-border bg-card px-2.5 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Half-Yearly">Half-Yearly</option>
                    <option value="Yearly">Yearly</option>
                    <option value="One-Time">One-Time</option>
                  </select>
                </div>

                {fields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    className="rounded-xl size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Subtotal Banner */}
          <div className="flex items-center justify-between rounded-2xl bg-secondary/70 p-4">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">
              Total Calculated Fee
            </span>
            <span className="font-mono text-lg font-black text-primary">
              ₹{totalAmount.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/fees/structure">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            Save Fee Structure
          </Button>
        </div>
      </form>
    </div>
  );
};
