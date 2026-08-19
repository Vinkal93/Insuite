import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  CreditCard,
  Eye,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeInvoice, SchoolClass } from "@/types";
import { listFeeInvoices } from "@/services/feeService";
import { getSchoolClasses } from "@/services/academicService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const StudentFeesListView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [invs, cls] = await Promise.all([
        listFeeInvoices(organization.id, {
          sessionId: selectedSession?.id,
          classId: selectedClassId || undefined,
          status: (selectedStatus as any) || undefined,
          searchQuery: searchQuery || undefined,
        }),
        getSchoolClasses(organization.id, selectedSession?.id),
      ]);
      setInvoices(invs);
      setClasses(cls);
    } catch (err: any) {
      console.error("StudentFeesListView load error:", err);
      setErrorMsg("Unable to load student fee records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession, selectedClassId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Student Fees Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor student fee invoices, dues, settled payments, and outstanding balances.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/fees/collect">
            <CreditCard className="size-3.5 mr-1.5" /> Collect Payment
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearchSubmit} className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-soft">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by student name, ID, or invoice..."
            className="pl-8 text-xs rounded-xl"
          />
        </div>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
        </select>

        <Button type="submit" variant="secondary" size="sm" className="rounded-xl text-xs font-semibold">
          Search
        </Button>
      </form>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-2xl bg-secondary/70" />
          ))}
        </div>
      ) : errorMsg ? (
        <div className="flex flex-col items-center justify-center p-8 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive">
          <AlertCircle className="size-6 mb-1.5" />
          <p className="text-xs font-bold">{errorMsg}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 rounded-xl text-xs font-semibold">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Users className="mx-auto size-8 text-muted-foreground opacity-50" />
          <p className="text-xs font-semibold text-muted-foreground">No student fee invoices found for these filters.</p>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/fees/structure">View Fee Structures</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Class</th>
                    <th className="px-4 py-3.5">Invoice #</th>
                    <th className="px-4 py-3.5">Due Date</th>
                    <th className="px-4 py-3.5">Total Amount</th>
                    <th className="px-4 py-3.5">Paid</th>
                    <th className="px-4 py-3.5">Balance</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-3.5 font-bold text-foreground">
                        <Link to="/fees/students/$studentId" params={{ studentId: inv.studentId }} className="hover:text-primary transition-colors">
                          {inv.studentName}
                        </Link>
                        {inv.admissionNumber && (
                          <span className="block text-[10px] font-normal text-muted-foreground">Adm: {inv.admissionNumber}</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 font-medium text-foreground">{inv.className}</td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{inv.dueDate}</td>
                      <td className="px-4 py-3.5 font-mono font-bold text-foreground">₹{inv.totalAmount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 font-mono text-emerald-600 font-bold">₹{inv.paidAmount.toLocaleString()}</td>
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
                      <td className="px-6 py-3.5 text-right space-x-1.5">
                        <Button variant="ghost" size="sm" asChild className="rounded-lg h-7 px-2 text-xs">
                          <Link to="/fees/students/$studentId" params={{ studentId: inv.studentId }}>
                            <Eye className="size-3.5 mr-1" /> Ledger
                          </Link>
                        </Button>
                        {inv.balanceAmount > 0 && (
                          <Button variant="hero" size="sm" asChild className="rounded-lg h-7 px-2 text-xs font-bold">
                            <Link to="/fees/collect" search={{ studentId: inv.studentId, invoiceId: inv.id }}>
                              Collect
                            </Link>
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-3 md:hidden">
            {invoices.map((inv) => (
              <div key={inv.id} className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-foreground">{inv.studentName}</h3>
                    <p className="text-[11px] text-muted-foreground">{inv.className} • Inv: {inv.invoiceNumber}</p>
                  </div>
                  <span
                    className={`rounded-md px-2 py-0.5 text-[9px] font-bold ${
                      inv.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : inv.status === "OVERDUE"
                        ? "bg-rose-500/10 text-rose-500"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 border-t border-border text-[11px]">
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">Total</span>
                    <strong className="font-mono text-foreground">₹{inv.totalAmount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">Paid</span>
                    <strong className="font-mono text-emerald-600">₹{inv.paidAmount.toLocaleString()}</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[9px] uppercase font-bold">Balance</span>
                    <strong className="font-mono text-rose-500">₹{inv.balanceAmount.toLocaleString()}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-border">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/fees/students/$studentId" params={{ studentId: inv.studentId }}>
                      View Ledger
                    </Link>
                  </Button>
                  {inv.balanceAmount > 0 && (
                    <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold h-8">
                      <Link to="/fees/collect" search={{ studentId: inv.studentId, invoiceId: inv.id }}>
                        Collect
                      </Link>
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
