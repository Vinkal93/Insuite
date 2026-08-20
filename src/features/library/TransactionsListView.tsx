import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookMarked,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  Clock,
  Receipt,
  Eye,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listTransactions,
  returnBook,
  renewBook,
  getLibrarySettings,
} from "@/services/libraryService";
import type { LibraryTransaction, LibrarySettingsConfig } from "@/types/library";
import { Button } from "@/components/ui/button";

export const TransactionsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [settings, setSettings] = useState<LibrarySettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter states
  const [activeTab, setActiveTab] = useState<"ALL" | "Issued" | "Returned" | "Overdue">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Return Modal State
  const [returningTrans, setReturningTrans] = useState<LibraryTransaction | null>(null);
  const [returnRemarks, setReturnRemarks] = useState("");
  const [payFineNow, setPayFineNow] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  const loadTransactions = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [tList, st] = await Promise.all([
        listTransactions(organization.id),
        getLibrarySettings(organization.id),
      ]);
      setTransactions(tList);
      setSettings(st);
    } catch (err: any) {
      console.error("loadTransactions error:", err);
      setError(err.message || "Failed to load circulation records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, [organization]);

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const matchesSearch =
        t.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.memberIdentifier.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "Issued") {
        return matchesSearch && t.status === "Issued";
      }
      if (activeTab === "Returned") {
        return matchesSearch && t.status === "Returned";
      }
      if (activeTab === "Overdue") {
        return matchesSearch && t.status === "Issued" && t.dueAt < todayStr;
      }
      return matchesSearch;
    });
  }, [transactions, searchQuery, activeTab, todayStr]);

  const handleOpenReturnModal = (t: LibraryTransaction) => {
    setReturningTrans(t);
    setReturnRemarks("");
    setPayFineNow(false);
    setPaymentMethod("Cash");
    setTransactionRef("");
  };

  const handleConfirmReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !returningTrans) return;

    setIsProcessingReturn(true);
    try {
      await returnBook(
        organization.id,
        {
          transactionId: returningTrans.id,
          remarks: returnRemarks.trim() || null,
          payFineNow,
          paymentMethod: payFineNow ? paymentMethod : null,
          transactionReference: payFineNow ? transactionRef.trim() || null : null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setReturningTrans(null);
      await loadTransactions();
    } catch (err: any) {
      alert("Failed to return book: " + err.message);
    } finally {
      setIsProcessingReturn(false);
    }
  };

  const handleRenew = async (t: LibraryTransaction) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Extend due date for "${t.bookTitle}" (Accession: ${t.accessionNumber})?`)) return;

    try {
      await renewBook(organization.id, t.id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadTransactions();
    } catch (err: any) {
      alert("Failed to renew book: " + err.message);
    }
  };

  // Calculate overdue days for modal
  let modalOverdueDays = 0;
  let modalFineAmount = 0;
  if (returningTrans) {
    const dueTime = new Date(returningTrans.dueAt).getTime();
    const todayTime = new Date(todayStr).getTime();
    if (todayTime > dueTime) {
      modalOverdueDays = Math.ceil((todayTime - dueTime) / (1000 * 60 * 60 * 24));
      modalFineAmount = modalOverdueDays * (settings?.finePerDay || 5);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Circulation & Loan Register
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time track of borrowed books, return processing, renewals, and overdue records.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/library/transactions/issue">
            <BookMarked className="size-3.5 mr-1.5" /> Issue Book
          </Link>
        </Button>
      </div>

      {/* Tabs & Search */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-surface p-1 rounded-2xl border border-border overflow-x-auto text-xs">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "ALL"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Loans ({transactions.length})
            </button>
            <button
              onClick={() => setActiveTab("Issued")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "Issued"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Active Loans ({transactions.filter((t) => t.status === "Issued").length})
            </button>
            <button
              onClick={() => setActiveTab("Overdue")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "Overdue"
                  ? "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overdue ({transactions.filter((t) => t.status === "Issued" && t.dueAt < todayStr).length})
            </button>
            <button
              onClick={() => setActiveTab("Returned")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "Returned"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Returned ({transactions.filter((t) => t.status === "Returned").length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search title, member, accession..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadTransactions} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <BookMarked className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No loan transactions found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Issue a book to students or faculty to begin tracking borrowing circulation.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/library/transactions/issue">
              <Plus className="size-3.5 mr-1" /> Issue Book
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Accession No.</th>
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Issued On</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Circulation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTransactions.map((t) => {
                const isOverdue = t.status === "Issued" && t.dueAt < todayStr;
                return (
                  <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{t.bookTitle}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {t.accessionNumber}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-foreground">{t.memberName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {t.memberType} (ID: {t.memberIdentifier})
                      </p>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{t.issuedAt.split("T")[0]}</td>
                    <td className="py-3 px-4">
                      <span className={`font-semibold ${isOverdue ? "text-destructive font-bold" : "text-foreground"}`}>
                        {t.dueAt}
                      </span>
                      {isOverdue && <span className="block text-[9px] text-destructive font-bold">OVERDUE</span>}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          t.status === "Issued"
                            ? isOverdue
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        }`}
                      >
                        {isOverdue ? "Overdue" : t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {t.status === "Issued" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="hero"
                            size="sm"
                            onClick={() => handleOpenReturnModal(t)}
                            className="h-7 px-2.5 text-xs font-bold shadow-soft"
                          >
                            Return Book
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleRenew(t)}
                            title="Renew loan period"
                            className="h-7 px-2 text-xs"
                          >
                            <RotateCcw className="size-3 mr-1" /> Renew
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground italic">
                          Returned on {t.returnedAt?.split("T")[0]}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Return Modal */}
      {returningTrans && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Return Book Copy</h3>
            <p className="text-xs text-muted-foreground">
              Confirm return for <span className="font-bold text-foreground">{returningTrans.bookTitle}</span> (Accession: {returningTrans.accessionNumber}).
            </p>

            {modalOverdueDays > 0 && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 space-y-2">
                <div className="flex items-center gap-2 text-destructive font-bold text-xs">
                  <AlertCircle className="size-4" />
                  <span>Late Return Penalty: {modalOverdueDays} Day(s) Overdue</span>
                </div>
                <p className="text-xs text-foreground">
                  Calculated Fine: <span className="font-black text-destructive text-sm">₹{modalFineAmount}</span> (@ ₹{settings?.finePerDay}/day)
                </p>
                <div className="flex items-center gap-2 pt-2 border-t border-destructive/20">
                  <input
                    type="checkbox"
                    id="payFine"
                    checked={payFineNow}
                    onChange={(e) => setPayFineNow(e.target.checked)}
                    className="size-4 rounded text-primary focus:ring-primary"
                  />
                  <label htmlFor="payFine" className="text-xs font-bold text-foreground cursor-pointer">
                    Collect & Pay Fine Immediately
                  </label>
                </div>
              </div>
            )}

            {payFineNow && (
              <div className="space-y-3 p-3 rounded-2xl border border-border bg-surface">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground"
                  >
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Receipt / Ref Number</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. REC-10293"
                    className="w-full rounded-xl border border-border bg-card px-3 py-1.5 text-xs text-foreground"
                  />
                </div>
              </div>
            )}

            <form onSubmit={handleConfirmReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Condition / Return Remarks
                </label>
                <input
                  type="text"
                  value={returnRemarks}
                  onChange={(e) => setReturnRemarks(e.target.value)}
                  placeholder="e.g. Returned in good condition"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setReturningTrans(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isProcessingReturn}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isProcessingReturn ? "Processing..." : "Confirm Return"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
