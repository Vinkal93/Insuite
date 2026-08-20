import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  BookMarked,
  Bookmark,
  Receipt,
  AlertTriangle,
  Clock,
  Plus,
  RefreshCw,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Users,
  Layers,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getLibraryDashboardStats,
  listTransactions,
  listBooks,
} from "@/services/libraryService";
import type { LibraryDashboardStats, LibraryTransaction, LibraryBook } from "@/types/library";
import { Button } from "@/components/ui/button";

export const LibraryDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<LibraryDashboardStats | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<LibraryTransaction[]>([]);
  const [popularBooks, setPopularBooks] = useState<LibraryBook[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [st, transList, booksList] = await Promise.all([
        getLibraryDashboardStats(organization.id),
        listTransactions(organization.id),
        listBooks(organization.id),
      ]);
      setStats(st);
      setRecentTransactions(transList.slice(0, 6));
      setPopularBooks(booksList.slice(0, 5));
    } catch (err: any) {
      console.error("Library dashboard load error:", err);
      setError(err.message || "Failed to load library dashboard analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse p-4" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Error Loading Library Dashboard</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split("T")[0];
  const overdueTransactions = recentTransactions.filter(
    (t) => t.status === "Issued" && t.dueAt < todayStr
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Library Command Center & Circulation
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time book inventory, borrower loans, overdue returns, and fines management.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/library/books/new">
              <Plus className="size-3.5 mr-1.5" /> Add New Book
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/library/transactions/issue">
              <BookMarked className="size-3.5 mr-1.5" /> Issue Book
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Book Titles & Copies */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Book Collection</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.totalBooks ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.totalCopies ?? 0} Total Physical Copies
          </p>
        </div>

        {/* Available vs Issued */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Available on Shelf</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-emerald-600">{stats?.availableCopies ?? 0}</p>
            <span className="text-xs font-semibold text-muted-foreground">Copies</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.issuedCopies ?? 0} Currently In Circulation
          </p>
        </div>

        {/* Overdue Returns */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">Overdue Books</span>
            <div className="size-8 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-destructive">{stats?.overdueBooks ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.reservedBooks ?? 0} Active Reservations
          </p>
        </div>

        {/* Outstanding Fines */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Unpaid Fines</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Receipt className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">
            ₹{(stats?.pendingFinesTotal ?? 0).toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.pendingFinesCount ?? 0} Pending Fine Invoices
          </p>
        </div>
      </div>

      {/* Main Grid: Recent Circulation & Catalog Spotlight */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Transactions */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Recent Circulation Activity</h2>
              <p className="text-xs text-muted-foreground">Latest issues, returns, and renewals</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/library/transactions">All Transactions →</Link>
            </Button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No transactions recorded yet. Click "Issue Book" to start loans.
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{t.bookTitle}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      Borrowed by: {t.memberName} ({t.memberType}) • Acc: {t.accessionNumber}
                    </p>
                    <p className="text-[9px] text-primary font-semibold mt-0.5">
                      Due: {t.dueAt} {t.dueAt < todayStr && t.status === "Issued" && "(OVERDUE)"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        t.status === "Issued"
                          ? t.dueAt < todayStr
                            ? "bg-destructive/10 text-destructive border-destructive/20"
                            : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      }`}
                    >
                      {t.status === "Issued" && t.dueAt < todayStr ? "Overdue" : t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Featured Catalog Spotlight */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Catalog Spotlight</h2>
              <p className="text-xs text-muted-foreground">Available titles in the institutional library</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/library/books">Browse All ({stats?.totalBooks ?? 0}) →</Link>
            </Button>
          </div>

          {popularBooks.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No books have been added to the library yet.
            </div>
          ) : (
            <div className="space-y-3">
              {popularBooks.map((b) => (
                <div
                  key={b.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{b.title}</p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      by {b.authorName} • {b.categoryName}
                    </p>
                    <span className="text-[9px] font-semibold text-emerald-600">
                      {b.availableCopies} of {b.totalCopies} Available
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs shrink-0">
                    <Link to="/library/books/$bookId" params={{ bookId: b.id }}>
                      View →
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
