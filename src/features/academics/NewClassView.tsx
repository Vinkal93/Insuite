import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { schoolClassSchema, type SchoolClassInput } from "@/schemas";
import {
  createSchoolClass,
  checkClassCodeAvailable,
  getAcademicSessionsList,
} from "@/services";
import type { AcademicSessionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const NewClassView: React.FC = () => {
  const { organization, firebaseUser, selectedSession } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<SchoolClassInput>({
    resolver: zodResolver(schoolClassSchema),
    defaultValues: {
      name: "",
      code: "",
      academicSessionId: selectedSession?.id || "",
      displayOrder: 1,
      description: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (organization) {
      getAcademicSessionsList(organization.id).then((list) => {
        setSessions(list);
        if (!form.getValues("academicSessionId") && list.length > 0) {
          const activeSess = list.find((s) => s.isActive) || list[0];
          form.setValue("academicSessionId", activeSess.id);
        }
      });
    }
  }, [organization]);

  const onSubmit = async (data: SchoolClassInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const isAvailable = await checkClassCodeAvailable(
        organization.id,
        data.academicSessionId,
        data.code
      );
      if (!isAvailable) {
        form.setError("code", { message: "This class code already exists in the chosen session." });
        return;
      }

      await createSchoolClass(organization.id, data, firebaseUser.uid);
      navigate({ to: "/academics/classes" });
    } catch (err: any) {
      console.error("Create class error:", err);
      setErrorMsg(err.message || "Failed to create class");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academics/classes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Add New Class
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure a grade level with automatic default Section A provisioning.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="academicSessionId" className="text-xs font-semibold">
              Academic Session *
            </Label>
            <select
              id="academicSessionId"
              {...form.register("academicSessionId")}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
            {form.formState.errors.academicSessionId && (
              <p className="text-[11px] text-destructive">
                {form.formState.errors.academicSessionId.message}
              </p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Class Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g. Class 10 or Grade 5"
                {...form.register("name")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Class Code *
              </Label>
              <Input
                id="code"
                placeholder="e.g. 10 or G5"
                {...form.register("code")}
                className="rounded-xl border-border bg-surface text-xs font-mono uppercase font-bold"
              />
              {form.formState.errors.code && (
                <p className="text-[11px] text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="displayOrder" className="text-xs font-semibold">
                Display / Sequence Order
              </Label>
              <Input
                id="displayOrder"
                type="number"
                {...form.register("displayOrder")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {form.formState.errors.displayOrder && (
                <p className="text-[11px] text-destructive">
                  {form.formState.errors.displayOrder.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                Class Status
              </Label>
              <select
                id="status"
                {...form.register("status")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Description / Notes (Optional)
            </Label>
            <Input
              id="description"
              placeholder="e.g. Senior Secondary Board batch"
              {...form.register("description")}
              className="rounded-xl border-border bg-surface text-xs"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/academics/classes">Cancel</Link>
            </Button>
            <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create Class
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
