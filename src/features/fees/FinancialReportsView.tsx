import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Layers,
  Users,
  CreditCard,
  AlertCircle,
  Printer,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeInvoice, FeePayment, SchoolClass } from "@/types";
import { listFeeInvoices, listFeePayments } from "@/services/feeService";
import { getSchoolClasses } from "@/services/academicService";
import { Button } from "@/components/ui/button";

export const FinancialReportsView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [reportType, setReportType] = useState<"daily" | "classwise" | "outstanding">("daily");
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!organization) return;
    setIsLoading(true);
    Promise.all([
      listFeeInvoices(organization.id, { sessionId: selectedSession?.id }),
      listFeePayments(organization.id),
      getSchoolClasses(organization.id, selectedSession?.id),
    ]).then(([invs, pays, cls]) => {
      setInvoices(invs);
      setPayments(pays);
      setClasses(cls);
      setIsLoading(false);
    });
  }, [organization, selectedSession]);

  const exportCSV = () => {
    let rows: string[][] = [];
    let filename = `financial_report_${reportType}.csv`;

    if (reportType === "daily") {
      rows = [
        ["Receipt #", "Student Name", "Class", "Payment Date", "Method", "Amount", "Cashier"],
        ...payments.map((p) => [
          p.receiptNumber,
          p.studentName,
          p.className || "",
          p.paymentDate,
          p.method,
          String(p.amount),
          p.collectedByName,
        ]),
      ];
    } else if (reportType === "outstanding") {
      rows = [
        ["Invoice #", "Student Name", "Class", "Due Date", "Total Billed", "Paid", "Outstanding Balance", "Status"],
        ...invoices
          .filter((i) => i.balanceAmount > 0)
          .map((i) => [
            i.invoiceNumber,
            i.studentName,
            i.className,
            i.dueDate,
            String(i.totalAmount),
            String(i.paidAmount),
            String(i.balanceAmount),
            i.status,
          ]),
      ];
    } else {
      rows = [
        ["Class Name", "Total Expected Billed", "Total Realized Collected", "Pending Balance"],
        ...classes.map((c) => {
          const classInvs = invoices.filter((i) => i.classId === c.id);
          const exp = classInvs.reduce((sum, i) => sum + i.totalAmount, 0);
          const col = classInvs.reduce((sum, i) => sum + i.paidAmount, 0);
          return [c.name, String(exp), String(col), String(exp - col)];
        }),
      ];
    }

    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Financial Analytics & Reports
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Audit-grade collection summaries, grade-wise realizations, and outstanding dues ledgers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()} className="rounded-xl text-xs font-semibold">
            <Printer className="size-3.5 mr-1.5" /> Print
          </Button>
          <Button variant="hero" size="sm" onClick={exportCSV} className="rounded-xl text-xs font-bold shadow-soft">
            <Download className="size-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Report Switcher Tabs */}
      <div className="flex rounded-2xl border border-border bg-card p-1.5 max-w-md shadow-xs">
        <button
          onClick={() => setReportType("daily")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            reportType === "daily" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Daily Collection
        </button>
        <button
          onClick={() => setReportType("classwise")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            reportType === "classwise" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Class-wise Realization
        </button>
        <button
          onClick={() => setReportType("outstanding")}
          className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition-all ${
            reportType === "outstanding" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Outstanding Dues
        </button>
      </div>

      {/* Report Body */}
      {reportType === "daily" && (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-foreground">Collection Log ({payments.length} receipts)</h3>
            <span className="text-xs font-mono font-bold text-emerald-600">
              Total: ₹{payments.reduce((s, p) => s + (p.amount || 0), 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Receipt #</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Method</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3 text-right">Cashier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{p.receiptNumber}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{p.studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{p.paymentDate}</td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3 font-mono font-bold text-emerald-600">₹{p.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.collectedByName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === "classwise" && (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden space-y-4 p-6">
          <h3 className="text-sm font-extrabold text-foreground">Class-wise Revenue Breakdown</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Class Grade</th>
                  <th className="px-4 py-3">Total Invoices</th>
                  <th className="px-4 py-3">Expected Amount</th>
                  <th className="px-4 py-3">Collected</th>
                  <th className="px-4 py-3">Pending Balance</th>
                  <th className="px-4 py-3 text-right">Realization Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {classes.map((c) => {
                  const classInvs = invoices.filter((i) => i.classId === c.id);
                  const expected = classInvs.reduce((sum, i) => sum + i.totalAmount, 0);
                  const collected = classInvs.reduce((sum, i) => sum + i.paidAmount, 0);
                  const pending = expected - collected;
                  const rate = expected > 0 ? Math.round((collected / expected) * 100) : 0;
                  return (
                    <tr key={c.id}>
                      <td className="px-4 py-3 font-bold text-foreground">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{classInvs.length}</td>
                      <td className="px-4 py-3 font-mono font-semibold">₹{expected.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-600">₹{collected.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono font-bold text-rose-500">₹{pending.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold">{rate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === "outstanding" && (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden space-y-4 p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-extrabold text-foreground">Outstanding Dues Ledger</h3>
            <span className="text-xs font-mono font-bold text-rose-500">
              Total Unpaid: ₹{invoices.filter((i) => i.balanceAmount > 0).reduce((s, i) => s + i.balanceAmount, 0).toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Student</th>
                  <th className="px-4 py-3">Class</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Total Amount</th>
                  <th className="px-4 py-3">Paid Amount</th>
                  <th className="px-4 py-3">Outstanding Balance</th>
                  <th className="px-4 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.filter((i) => i.balanceAmount > 0).map((inv) => (
                  <tr key={inv.id}>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 font-semibold text-foreground">{inv.studentName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.className}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.dueDate}</td>
                    <td className="px-4 py-3 font-mono">₹{inv.totalAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono text-emerald-600">₹{inv.paidAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 font-mono font-bold text-rose-500">₹{inv.balanceAmount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold text-amber-600">
                        {inv.status}
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
