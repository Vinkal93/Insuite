import React, { useState, useEffect } from "react";
import { CreditCard, Receipt, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { getStudentFeeSummary, listFeeInvoices } from "@/services/feeService";
import type { FeeInvoice } from "@/types/fee";
import { Button } from "@/components/ui/button";

export const StudentFeesView: React.FC = () => {
  const { organization } = useAuth();
  const { student } = useStudent();

  const [feeSummary, setFeeSummary] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFees = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [summary, invs] = await Promise.all([
        getStudentFeeSummary(organization.id, student.id),
        listFeeInvoices(organization.id, { studentId: student.id }),
      ]);
      setFeeSummary(summary);
      setInvoices(invs);
    } catch (err: any) {
      console.error("loadStudentFees error:", err);
      setError(err.message || "Failed to load fee information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [organization, student]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Fee Status & Invoices
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Term billing breakdown and fee clearance records.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadFees} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Invoiced</span>
              <p className="text-2xl font-black text-foreground mt-1">
                ₹{feeSummary?.totalBilled?.toLocaleString() || 0}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Paid</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{feeSummary?.totalPaid?.toLocaleString() || 0}
              </p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Outstanding</span>
              <p
                className={`text-2xl font-black mt-1 ${
                  (feeSummary?.totalPending || 0) > 0 ? "text-rose-600" : "text-foreground"
                }`}
              >
                ₹{feeSummary?.totalPending?.toLocaleString() || 0}
              </p>
            </div>
          </div>

          {/* Invoices List */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Term Invoices</h3>

            {invoices.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No fee invoices on record.
              </div>
            ) : (
              <div className="space-y-3">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-foreground">{inv.invoiceNumber}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            inv.status === "PAID"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Due: {inv.dueDate}</p>
                    </div>

                    <div className="text-right sm:self-center">
                      <p className="text-sm font-black text-foreground">
                        ₹{inv.totalAmount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
