import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CreditCard,
  Receipt,
  FileText,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Clock,
  Download,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import {
  getStudentFeeSummary,
  listFeeInvoices,
  listFeePayments,
} from "@/services/feeService";
import type { FeeInvoice, FeePayment } from "@/types/fee";
import { Button } from "@/components/ui/button";

export const ParentFeesView: React.FC = () => {
  const { organization } = useAuth();
  const { selectedChild, children: kids } = useParent();

  const [feeSummary, setFeeSummary] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [activeTab, setActiveTab] = useState<"invoices" | "receipts">("invoices");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFees = async () => {
    if (!organization || !selectedChild) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [summary, invs, pays] = await Promise.all([
        getStudentFeeSummary(organization.id, selectedChild.id),
        listFeeInvoices(organization.id, { studentId: selectedChild.id }),
        listFeePayments(organization.id, { studentId: selectedChild.id }),
      ]);
      setFeeSummary(summary);
      setInvoices(invs);
      setPayments(pays);
    } catch (err: any) {
      console.error("loadFees error:", err);
      setError(err.message || "Failed to load fee information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [organization, selectedChild]);

  if (kids.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <CreditCard className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">No Children Linked</h2>
        <p className="mt-1 text-xs text-muted-foreground">Please contact school administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Fee Invoices & Receipts
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Billing summaries, school invoices, and payment receipts for{" "}
          <span className="font-bold text-foreground">{selectedChild?.fullName}</span>
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
              <span className="text-[10px] text-muted-foreground font-semibold">Academic Dues</span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Paid</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                ₹{feeSummary?.totalPaid?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] text-muted-foreground font-semibold">Confirmed Receipts</span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Pending Balance</span>
              <p
                className={`text-2xl font-black mt-1 ${
                  (feeSummary?.totalPending || 0) > 0 ? "text-rose-600" : "text-foreground"
                }`}
              >
                ₹{feeSummary?.totalPending?.toLocaleString() || 0}
              </p>
              <span className="text-[10px] text-muted-foreground font-semibold">Outstanding Dues</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 border-b border-border">
            <button
              onClick={() => setActiveTab("invoices")}
              className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-colors ${
                activeTab === "invoices"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Fee Invoices ({invoices.length})
            </button>
            <button
              onClick={() => setActiveTab("receipts")}
              className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-colors ${
                activeTab === "receipts"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              Payment Receipts ({payments.length})
            </button>
          </div>

          {/* Invoices List */}
          {activeTab === "invoices" && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              {invoices.length === 0 ? (
                <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No invoices generated for this student.
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
                                : inv.status === "PARTIAL"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Due Date: {inv.dueDate} • Issue Date: {inv.issueDate}
                        </p>
                      </div>

                      <div className="text-right sm:self-center">
                        <p className="text-sm font-black text-foreground">
                          ₹{inv.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Paid: ₹{inv.paidAmount.toLocaleString()} • Balance: ₹
                          {inv.balanceAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Receipts List */}
          {activeTab === "receipts" && (
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              {payments.length === 0 ? (
                <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No payment receipts recorded yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {payments.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 rounded-2xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                          <Receipt className="size-4" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-foreground">{p.receiptNumber}</span>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Date: {p.paymentDate} • Mode: {p.paymentMode}
                          </p>
                        </div>
                      </div>

                      <div className="text-right sm:self-center">
                        <p className="text-sm font-black text-emerald-600">
                          ₹{p.amount.toLocaleString()}
                        </p>
                        <span className="inline-block text-[9px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          Confirmed
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
