import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  User,
  CreditCard,
  Receipt,
  FileText,
  Calendar,
  Phone,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { StudentFeeSummary } from "@/types/fees";
import { getStudentFeeSummary } from "@/services/feeService";
import { Button } from "@/components/ui/button";

export const StudentFeeProfileView: React.FC = () => {
  const { studentId } = useParams({ from: "/fees/students/$studentId" });
  const { organization } = useAuth();
  const [summary, setSummary] = useState<StudentFeeSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    if (!organization || !studentId) return;
    setIsLoading(true);
    try {
      const data = await getStudentFeeSummary(organization.id, studentId);
      setSummary(data);
    } catch (err) {
      console.error("getStudentFeeSummary error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, studentId]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
        <div className="h-40 animate-pulse rounded-3xl bg-secondary/80" />
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
        <AlertCircle className="mx-auto size-8 text-rose-500" />
        <h3 className="text-sm font-bold text-foreground">Student fee records not found</h3>
        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/fees/students">Back to Student Fees</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl size-9">
            <Link to="/fees/students">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                {summary.studentName}
              </h1>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
                {summary.admissionNumber || summary.studentId.slice(0, 8)}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Class: <strong className="text-foreground">{summary.className} {summary.sectionName ? `(${summary.sectionName})` : ""}</strong>
              {summary.parentName && ` • Parent: ${summary.parentName}`}
              {summary.parentMobile && ` (${summary.parentMobile})`}
            </p>
          </div>
        </div>

        {summary.totalPending > 0 && (
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/fees/collect" search={{ studentId: summary.studentId }}>
              <CreditCard className="size-3.5 mr-1.5" /> Collect Payment
            </Link>
          </Button>
        )}
      </div>

      {/* Financial Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Assigned</span>
          <p className="text-2xl font-black text-foreground">₹{summary.totalAssigned.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Cumulative Billed</p>
        </div>

        <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-5 shadow-soft space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600">Total Paid</span>
          <p className="text-2xl font-black text-emerald-600">₹{summary.totalPaid.toLocaleString()}</p>
          <p className="text-[11px] text-emerald-700/80">Confirmed Cleared</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Pending</span>
          <p className="text-2xl font-black text-foreground">₹{summary.totalPending.toLocaleString()}</p>
          <p className="text-[11px] text-muted-foreground">Current Outstanding</p>
        </div>

        <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-5 shadow-soft space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-rose-500">Overdue Amount</span>
          <p className="text-2xl font-black text-rose-500">₹{summary.totalOverdue.toLocaleString()}</p>
          <p className="text-[11px] text-rose-600/80">Past Due Date</p>
        </div>
      </div>

      {/* Invoices & Fee Ledger */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-extrabold text-foreground">Fee Ledger & Invoices ({summary.invoices.length})</h2>
        </div>

        {summary.invoices.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">No fee invoices recorded for this student.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Invoice #</th>
                  <th className="px-4 py-3.5">Fee Structure</th>
                  <th className="px-4 py-3.5">Due Date</th>
                  <th className="px-4 py-3.5">Total</th>
                  <th className="px-4 py-3.5">Paid</th>
                  <th className="px-4 py-3.5">Balance</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-foreground">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{inv.feeStructureName}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{inv.dueDate}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-foreground">₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">₹{inv.paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-rose-500">₹{inv.balanceAmount.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : inv.status === "OVERDUE"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-right">
                      {inv.balanceAmount > 0 && (
                        <Button variant="hero" size="sm" asChild className="rounded-lg h-7 px-2 text-xs font-bold">
                          <Link to="/fees/collect" search={{ studentId: summary.studentId, invoiceId: inv.id }}>
                            Pay
                          </Link>
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment Receipts History */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-extrabold text-foreground">Payment Transaction History ({summary.payments.length})</h2>
        </div>

        {summary.payments.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground italic">No payment receipts issued for this student yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-6 py-3.5">Receipt #</th>
                  <th className="px-4 py-3.5">Payment Date</th>
                  <th className="px-4 py-3.5">Method</th>
                  <th className="px-4 py-3.5">Reference #</th>
                  <th className="px-4 py-3.5">Amount Paid</th>
                  <th className="px-4 py-3.5">Collected By</th>
                  <th className="px-6 py-3.5 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summary.payments.map((p) => (
                  <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-foreground">{p.receiptNumber}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{p.paymentDate}</td>
                    <td className="px-4 py-3.5 font-semibold text-foreground">{p.method}</td>
                    <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">{p.referenceNumber || "—"}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{p.collectedByName}</td>
                    <td className="px-6 py-3.5 text-right">
                      <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
