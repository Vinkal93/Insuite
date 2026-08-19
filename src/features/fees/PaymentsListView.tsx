import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Receipt,
  Search,
  CreditCard,
  Printer,
  AlertCircle,
  RefreshCw,
  Eye,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeePayment, PaymentMethod } from "@/types/fees";
import { listFeePayments } from "@/services/feeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const PaymentsListView: React.FC = () => {
  const { organization } = useAuth();
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | "">("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const list = await listFeePayments(organization.id, {
        method: selectedMethod || undefined,
        searchQuery: searchQuery || undefined,
      });
      setPayments(list);
    } catch (err: any) {
      console.error("listFeePayments error:", err);
      setErrorMsg("Unable to load payment transactions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedMethod]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const totalCollected = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Payment Transactions
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete transaction ledger of confirmed student fee receipts and collection history.
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
            placeholder="Search by receipt #, student name, or ref..."
            className="pl-8 text-xs rounded-xl"
          />
        </div>

        <select
          value={selectedMethod}
          onChange={(e) => setSelectedMethod(e.target.value as any)}
          className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">All Payment Methods</option>
          <option value="Cash">Cash</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cheque">Cheque</option>
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
      ) : payments.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-3">
          <Receipt className="mx-auto size-8 text-muted-foreground opacity-50" />
          <p className="text-xs font-semibold text-muted-foreground">No payment records found.</p>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/fees/collect">
              <CreditCard className="size-3.5 mr-1.5" /> Collect First Fee
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="text-muted-foreground">Showing {payments.length} transaction records</span>
            <span className="font-bold text-foreground">
              Total Filtered Volume: <strong className="font-mono text-emerald-600">₹{totalCollected.toLocaleString()}</strong>
            </span>
          </div>

          <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-6 py-3.5">Receipt #</th>
                    <th className="px-4 py-3.5">Student</th>
                    <th className="px-4 py-3.5">Payment Date</th>
                    <th className="px-4 py-3.5">Method</th>
                    <th className="px-4 py-3.5">Reference #</th>
                    <th className="px-4 py-3.5">Amount Paid</th>
                    <th className="px-4 py-3.5">Collected By</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {payments.map((p) => (
                    <tr key={p.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-bold text-foreground">{p.receiptNumber}</td>
                      <td className="px-4 py-3.5 font-semibold text-foreground">
                        <Link to="/fees/students/$studentId" params={{ studentId: p.studentId }} className="hover:text-primary transition-colors">
                          {p.studentName}
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-muted-foreground">{p.paymentDate}</td>
                      <td className="px-4 py-3.5">
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-bold text-foreground">
                          {p.method}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-muted-foreground">{p.referenceNumber || "—"}</td>
                      <td className="px-4 py-3.5 font-mono font-black text-emerald-600">₹{p.amount.toLocaleString()}</td>
                      <td className="px-4 py-3.5 text-muted-foreground">{p.collectedByName}</td>
                      <td className="px-6 py-3.5 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.print()}
                          className="rounded-lg h-7 px-2 text-xs"
                        >
                          <Printer className="size-3.5 mr-1 text-primary" /> Print
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
