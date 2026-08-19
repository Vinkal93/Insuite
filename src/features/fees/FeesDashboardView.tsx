import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wallet,
  TrendingUp,
  CreditCard,
  AlertCircle,
  Clock,
  Layers,
  ArrowRight,
  Plus,
  Receipt,
  Users,
  CheckCircle2,
  Calendar,
  DollarSign,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeDashboardStats, FeeInvoice, FeePayment } from "@/types/fees";
import { getFeeDashboardStats, listFeeInvoices, listFeePayments } from "@/services/feeService";
import { Button } from "@/components/ui/button";

export const FeesDashboardView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [stats, setStats] = useState<FeeDashboardStats | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<FeeInvoice[]>([]);
  const [recentPayments, setRecentPayments] = useState<FeePayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [s, invs, pays] = await Promise.all([
        getFeeDashboardStats(organization.id, selectedSession?.id),
        listFeeInvoices(organization.id, { sessionId: selectedSession?.id }),
        listFeePayments(organization.id),
      ]);
      setStats(s);
      setRecentInvoices(invs.slice(0, 5));
      setRecentPayments(pays.slice(0, 5));
    } catch (err: any) {
      console.error("Fees dashboard error:", err);
      setErrorMsg("Unable to load fee statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-secondary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-secondary/80 border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive my-8">
        <AlertCircle className="size-8 mb-2" />
        <h3 className="text-base font-bold">Unable to load fee information</h3>
        <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
        <Button onClick={loadData} variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-semibold">
          <RefreshCw className="size-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const isConfigured = stats?.isConfigured;
  const collectionPercent =
    stats && stats.totalExpected > 0
      ? Math.round((stats.totalCollected / stats.totalExpected) * 100)
      : 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Fees & Finance Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Track tuition fee billing, collection receipts, pending ledger balances, and payment reconciliations.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/fees/collect">
              <CreditCard className="size-3.5 mr-1.5" /> Collect Fees
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/fees/structure/new">
              <Plus className="size-3.5 mr-1.5" /> Fee Structure
            </Link>
          </Button>
        </div>
      </div>

      {!isConfigured ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Wallet className="size-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">Fee structure is not configured</h3>
            <p className="text-xs text-muted-foreground">
              Define tuition, admission, examination, and computer fee components for your academic classes to begin generating student invoices.
            </p>
          </div>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/fees/structure/new">Configure Fee Structure</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Top 6 KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Expected</span>
              <p className="text-xl font-black text-foreground">₹{stats?.totalExpected.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{stats?.totalInvoices} Invoices Generated</p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Total Collected</span>
              <p className="text-xl font-black text-emerald-600">₹{stats?.totalCollected.toLocaleString()}</p>
              <p className="text-[10px] text-emerald-700/80">{collectionPercent}% Realized</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Pending</span>
              <p className="text-xl font-black text-foreground">₹{stats?.totalPending.toLocaleString()}</p>
              <p className="text-[10px] text-muted-foreground">{stats?.pendingInvoicesCount} Invoices Pending</p>
            </div>

            <div className="rounded-3xl border border-rose-500/20 bg-rose-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-rose-500">Overdue Dues</span>
              <p className="text-xl font-black text-rose-500">₹{stats?.totalOverdue.toLocaleString()}</p>
              <p className="text-[10px] text-rose-600/80">{stats?.defaultersCount} Defaulter Invoices</p>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-blue-600">Today's Collection</span>
              <p className="text-xl font-black text-blue-600">₹{stats?.todayCollection.toLocaleString()}</p>
              <p className="text-[10px] text-blue-700/80">Daily Counter Total</p>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-600">This Month</span>
              <p className="text-xl font-black text-purple-600">₹{stats?.thisMonthCollection.toLocaleString()}</p>
              <p className="text-[10px] text-purple-700/80">Monthly Realization</p>
            </div>
          </div>

          {/* Realization Progress Bar */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-foreground">Overall Collection Rate</span>
              <span className="font-mono font-bold text-primary">{collectionPercent}% Realized</span>
            </div>
            <div className="h-3 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all duration-700"
                style={{ width: `${collectionPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>Collected: ₹{stats?.totalCollected.toLocaleString()}</span>
              <span>Pending Balance: ₹{stats?.totalPending.toLocaleString()}</span>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/fees/students"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500 group-hover:scale-110 transition-transform">
                  <Users className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Student Fees</h4>
                  <p className="text-[11px] text-muted-foreground">View individual ledgers</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/fees/payments"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 group-hover:scale-110 transition-transform">
                  <Receipt className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Transactions</h4>
                  <p className="text-[11px] text-muted-foreground">Payment receipts stream</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/fees/defaulters"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-500/10 p-3 text-rose-500 group-hover:scale-110 transition-transform">
                  <AlertCircle className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Fee Defaulters</h4>
                  <p className="text-[11px] text-muted-foreground">{stats?.defaultersCount} Overdue cases</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/fees/reports"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600 group-hover:scale-110 transition-transform">
                  <TrendingUp className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Financial Reports</h4>
                  <p className="text-[11px] text-muted-foreground">Daily, monthly & class-wise</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Recent Invoices & Payments Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Invoices */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Recent Fee Invoices</h3>
                  <p className="text-xs text-muted-foreground">Recently billed student invoices</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                  <Link to="/fees/students">View All</Link>
                </Button>
              </div>

              {recentInvoices.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground italic">No invoices generated yet.</p>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {recentInvoices.map((inv) => (
                    <div key={inv.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-foreground">{inv.studentName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {inv.className} • Inv: {inv.invoiceNumber}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-foreground">₹{inv.totalAmount.toLocaleString()}</p>
                        <span
                          className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
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
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent Payments */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Recent Payments</h3>
                  <p className="text-xs text-muted-foreground">Confirmed collected receipts</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                  <Link to="/fees/payments">View All</Link>
                </Button>
              </div>

              {recentPayments.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground italic">No payment transactions yet.</p>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {recentPayments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-foreground">{p.studentName}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {p.receiptNumber} • {p.method}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold text-emerald-600">₹{p.amount.toLocaleString()}</p>
                        <p className="text-[10px] text-muted-foreground">{p.paymentDate}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
