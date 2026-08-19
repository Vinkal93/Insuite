import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Percent,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeDiscount } from "@/types/fees";
import { feeDiscountSchema, type FeeDiscountInput } from "@/schemas/fees";
import { listFeeDiscounts, createFeeDiscount } from "@/services/feeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const DiscountsListView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [discounts, setDiscounts] = useState<FeeDiscount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<FeeDiscountInput>({
    resolver: zodResolver(feeDiscountSchema),
    defaultValues: {
      name: "",
      type: "PERCENTAGE",
      value: 10,
      applicableComponent: "Tuition Fee",
      reason: "",
    },
  });

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const list = await listFeeDiscounts(organization.id);
      setDiscounts(list);
    } catch (err) {
      console.error("listFeeDiscounts error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const onAddDiscount = async (data: FeeDiscountInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createFeeDiscount(organization.id, data, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Admin",
      });
      setShowAddModal(false);
      form.reset();
      loadData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to create discount policy.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Fee Concessions & Discounts
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure sibling discounts, merit scholarships, staff child concessions, and waivers.
          </p>
        </div>

        <Button
          onClick={() => setShowAddModal(true)}
          variant="hero"
          size="sm"
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Discount Policy
        </Button>
      </div>

      {/* Modal / Slide-down Form */}
      {showAddModal && (
        <div className="rounded-3xl border border-primary/20 bg-card p-6 shadow-soft sm:p-8 space-y-4 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <h3 className="text-sm font-extrabold text-foreground">New Discount / Concession Rule</h3>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAddModal(false)}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
          </div>

          {errorMsg && (
            <div className="flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
              <AlertCircle className="size-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={form.handleSubmit(onAddDiscount)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Policy Name *</Label>
                <Input
                  {...form.register("name")}
                  placeholder="e.g. Sibling Discount (Second Child)"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Discount Type *</Label>
                <select
                  {...form.register("type")}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="PERCENTAGE">Percentage (%)</option>
                  <option value="FIXED">Fixed Amount (₹)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Value *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min={0.01}
                  {...form.register("value")}
                  placeholder="e.g. 15 or 2500"
                  className="rounded-xl text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Applicable Component</Label>
                <Input
                  {...form.register("applicableComponent")}
                  placeholder="e.g. Tuition Fee"
                  className="rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">Reason / Justification *</Label>
                <Input
                  {...form.register("reason")}
                  placeholder="Policy criteria & eligibility rationale..."
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button
                type="submit"
                variant="hero"
                disabled={isSubmitting}
                className="rounded-xl text-xs font-bold shadow-soft"
              >
                {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-3.5 mr-1.5" />}
                Save Discount Policy
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/70" />
          ))}
        </div>
      ) : discounts.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Percent className="mx-auto size-8 text-muted-foreground opacity-50" />
          <p className="text-xs font-semibold text-muted-foreground">No fee discount policies configured yet.</p>
          <Button onClick={() => setShowAddModal(true)} variant="outline" size="sm" className="rounded-xl text-xs font-semibold">
            <Plus className="size-3.5 mr-1" /> Add First Policy
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Policy Name</th>
                  <th className="px-4 py-3.5">Type</th>
                  <th className="px-4 py-3.5">Discount Value</th>
                  <th className="px-4 py-3.5">Applicable Component</th>
                  <th className="px-4 py-3.5">Reason</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {discounts.map((d) => (
                  <tr key={d.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-foreground">{d.name}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{d.type}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">
                      {d.type === "PERCENTAGE" ? `${d.value}%` : `₹${d.value.toLocaleString()}`}
                    </td>
                    <td className="px-4 py-3.5 text-foreground">{d.applicableComponent || "All"}</td>
                    <td className="px-4 py-3.5 text-muted-foreground line-clamp-1">{d.reason}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                        {d.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
