import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { CreditCard, Search, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listFeeInvoices } from "@/services/feeService";
import { listHostelAllocations } from "@/services/hostelService";
import type { FeeInvoice } from "@/types/fees";
import type { HostelAllocation } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelFeesView: React.FC = () => {
  const { organization } = useAuth();
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadFeeData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [invList, allocList] = await Promise.all([
        listFeeInvoices(organization.id),
        listHostelAllocations(organization.id, { status: "Active" }),
      ]);
      setAllocations(allocList);

      const residentStudentIds = new Set(allocList.map((a) => a.studentId));
      // Invoices for hostel residents or containing "Hostel" component
      const hostelInvoices = invList.filter(
        (inv) =>
          residentStudentIds.has(inv.studentId) ||
          inv.items.some((i) => i.componentName.toLowerCase().includes("hostel"))
      );
      setInvoices(hostelInvoices);
    } catch (err: any) {
      console.error("loadHostelFees error:", err);
      setError(err.message || "Failed to load hostel fee records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeeData();
  }, [organization]);

  const totalDue = invoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + inv.paidAmount, 0);
  const totalPending = invoices.reduce((acc, inv) => acc + (inv.balanceAmount || 0), 0);

  const filteredInvoices = search
    ? invoices.filter(
        (inv) =>
          inv.studentName.toLowerCase().includes(search.toLowerCase()) ||
          inv.invoiceNumber.toLowerCase().includes(search.toLowerCase())
      )
    : invoices;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Fee Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Integrated with Institutional Finance Engine — room rents, mess charges, and security deposits.
          </p>
        </div>

        <Link
          to="/fees/collect"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <CreditCard className="size-4" /> Collect Hostel Fee
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Total Invoiced</span>
          <p className="text-2xl font-black text-foreground">₹{totalDue.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Across Boarding Students</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Collected</span>
          <p className="text-2xl font-black text-emerald-600">₹{totalPaid.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Realized payments</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-1">
          <span className="text-[11px] font-bold text-muted-foreground uppercase">Pending Balance</span>
          <p className="text-2xl font-black text-rose-600">₹{totalPending.toLocaleString()}</p>
          <span className="text-[10px] text-muted-foreground font-semibold">Outstanding boarding dues</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by student name or invoice number..."
          className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadFeeData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredInvoices.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CreditCard className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No hostel fee records</h3>
          <p className="mt-1 text-xs text-muted-foreground">Invoices generated for boarding students will appear here.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Invoice No</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Due Date</th>
                  <th className="py-3 px-4">Total Amount</th>
                  <th className="py-3 px-4">Paid</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {inv.invoiceNumber}
                    </td>

                    <td className="py-3 px-4 font-bold text-foreground">{inv.studentName}</td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">{inv.dueDate}</td>

                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      ₹{inv.totalAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                      ₹{inv.paidAmount.toLocaleString()}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-rose-600">
                      ₹{(inv.balanceAmount || 0).toLocaleString()}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          inv.status === "PAID"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : inv.status === "PARTIAL"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Link
                        to="/fees/collect"
                        className="font-bold text-primary hover:underline text-[11px] inline-flex items-center gap-1"
                      >
                        Collect <ArrowRight className="size-3" />
                      </Link>
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
