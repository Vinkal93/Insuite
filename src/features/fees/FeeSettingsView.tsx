import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Receipt,
  Clock,
  CreditCard,
  FileText,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { feeSettingsSchema, type FeeSettingsInput } from "@/schemas/fees";
import { getFeeSettings, updateFeeSettings } from "@/services/feeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const FeeSettingsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<FeeSettingsInput>({
    resolver: zodResolver(feeSettingsSchema),
    defaultValues: {
      feeNumbering: {
        receiptPrefix: "REC",
        invoicePrefix: "INV",
      },
      lateFee: {
        enabled: false,
        type: "FIXED",
        amount: 50,
        gracePeriodDays: 7,
      },
      paymentMethods: {
        cash: true,
        upi: true,
        card: true,
        bankTransfer: true,
        cheque: true,
      },
      receiptSettings: {
        showLogo: true,
        showPrincipalSign: true,
        termsAndConditions: "Fees once paid are non-refundable unless approved by management.",
        headerNotes: "Official Fee Receipt",
      },
      currency: "INR (₹)",
    },
  });

  useEffect(() => {
    if (!organization) return;
    getFeeSettings(organization.id).then((config) => {
      form.reset(config);
    });
  }, [organization]);

  const onSubmit = async (data: FeeSettingsInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateFeeSettings(organization.id, data, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "Admin",
      });
      setSuccessMsg("Fee and billing configurations saved successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to update fee settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Fee & Financial Settings
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure receipt number series, late penalty fines, active payment channels, and receipt layout.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Numbering Formats */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Receipt className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Document Numbering Prefixes
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Receipt Number Prefix</Label>
              <Input
                {...form.register("feeNumbering.receiptPrefix")}
                placeholder="e.g. REC"
                className="rounded-xl text-xs font-mono font-bold"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Invoice Number Prefix</Label>
              <Input
                {...form.register("feeNumbering.invoicePrefix")}
                placeholder="e.g. INV"
                className="rounded-xl text-xs font-mono font-bold"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Late Fine / Penalty Policy */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Clock className="size-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Late Fee Fine & Grace Period
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="enableLateFee"
                checked={form.watch("lateFee.enabled")}
                onCheckedChange={(checked) => form.setValue("lateFee.enabled", !!checked)}
              />
              <Label htmlFor="enableLateFee" className="text-xs font-semibold cursor-pointer">
                Automatically levy late fine on overdue invoices past the grace period
              </Label>
            </div>

            {form.watch("lateFee.enabled") && (
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Calculation Type</Label>
                  <select
                    {...form.register("lateFee.type")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="FIXED">Fixed Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Fine Amount</Label>
                  <Input
                    type="number"
                    min={0}
                    {...form.register("lateFee.amount")}
                    className="rounded-xl text-xs font-mono font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Grace Period (Days)</Label>
                  <Input
                    type="number"
                    min={0}
                    {...form.register("lateFee.gracePeriodDays")}
                    className="rounded-xl text-xs font-bold"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 3: Receipt Template */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <FileText className="size-4 text-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Receipt Terms & Notes
            </h2>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Receipt Terms & Conditions</Label>
              <Input
                {...form.register("receiptSettings.termsAndConditions")}
                placeholder="e.g. Fees once paid are non-refundable..."
                className="rounded-xl text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Header Note</Label>
              <Input
                {...form.register("receiptSettings.headerNotes")}
                placeholder="e.g. Official Institutional Fee Receipt"
                className="rounded-xl text-xs"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-2">
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
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
