import React, { useState, useEffect, useMemo } from "react";
import {
  Receipt,
  Search,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listFines,
  payFine,
  waiveFine,
} from "@/services/libraryService";
import type { LibraryFine } from "@/types/library";
import { Button } from "@/components/ui/button";

export const FinesListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [fines, setFines] = useState<LibraryFine[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"ALL" | "Pending" | "Paid" | "Waived">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Pay Modal State
  const [payingFine, setPayingFine] = useState<LibraryFine | null>(null);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [transactionRef, setTransactionRef] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  // Waive Modal State
  const [waivingFine, setWaivingFine] = useState<LibraryFine | null>(null);
  const [waiverReason, setWaiverReason] = useState("");
  const [isWaiving, setIsWaiving] = useState(false);

  const loadFines = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listFines(organization.id);
      setFines(data);
    } catch (err: any) {
      console.error("loadFines error:", err);
      setError(err.message || "Failed to load fine records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFines();
  }, [organization]);

  const filteredFines = useMemo(() => {
    return fines.filter((f) => {
      const matchesSearch =
        f.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.bookTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.accessionNumber.toLowerCase().includes(searchQuery.toLowerCase());

      if (activeTab === "ALL") return matchesSearch;
      return matchesSearch && f.status === activeTab;
    });
  }, [fines, searchQuery, activeTab]);

  const handlePayConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !payingFine) return;

    setIsPaying(true);
    try {
      await payFine(
        organization.id,
        payingFine.id,
        paymentMethod,
        transactionRef.trim() || null,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setPayingFine(null);
      await loadFines();
    } catch (err: any) {
      alert("Failed to record payment: " + err.message);
    } finally {
      setIsPaying(false);
    }
  };

  const handleWaiveConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !waivingFine) return;
    if (!waiverReason.trim()) {
      alert("A reason is required to waive a fine penalty.");
      return;
    }

    setIsWaiving(true);
    try {
      await waiveFine(
        organization.id,
        {
          fineId: waivingFine.id,
          reason: waiverReason.trim(),
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setWaivingFine(null);
      await loadFines();
    } catch (err: any) {
      alert("Failed to waive fine: " + err.message);
    } finally {
      setIsWaiving(false);
    }
  };

  const totalPendingAmount = fines
    .filter((f) => f.status === "Pending")
    .reduce((sum, f) => sum + f.amount, 0);

  const totalCollectedAmount = fines
    .filter((f) => f.status === "Paid")
    .reduce((sum, f) => sum + f.amount, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Library Overdue Fines & Penalties
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit late returns, collect fine payments, and manage authorized penalty waivers.
          </p>
        </div>
      </div>

      {/* KPI Ribbon */}
      <div className="grid gap-4 sm:grid-cols-2 max-w-md">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] uppercase font-bold text-destructive">Outstanding Balance</span>
          <p className="text-2xl font-black text-destructive mt-1">₹{totalPendingAmount}</p>
          <span className="text-[10px] text-muted-foreground">
            {fines.filter((f) => f.status === "Pending").length} pending invoices
          </span>
        </div>
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] uppercase font-bold text-emerald-600">Total Collected</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">₹{totalCollectedAmount}</p>
          <span className="text-[10px] text-muted-foreground">
            {fines.filter((f) => f.status === "Paid").length} cleared payments
          </span>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
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
              All Invoices ({fines.length})
            </button>
            <button
              onClick={() => setActiveTab("Pending")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "Pending"
                  ? "bg-destructive text-destructive-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending ({fines.filter((f) => f.status === "Pending").length})
            </button>
            <button
              onClick={() => setActiveTab("Paid")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "Paid"
                  ? "bg-emerald-600 text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paid ({fines.filter((f) => f.status === "Paid").length})
            </button>
            <button
              onClick={() => setActiveTab("Waived")}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                activeTab === "Waived"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Waived ({fines.filter((f) => f.status === "Waived").length})
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search member, book, accession..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      </div>

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
          <Button onClick={loadFines} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredFines.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Receipt className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No fine records found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Fines are automatically generated when overdue books are returned.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Borrower</th>
                <th className="py-3 px-4">Book Title</th>
                <th className="py-3 px-4">Accession No.</th>
                <th className="py-3 px-4">Days Overdue</th>
                <th className="py-3 px-4">Fine Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredFines.map((f) => (
                <tr key={f.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{f.memberName}</p>
                    <span className="text-[10px] text-muted-foreground">{f.memberType}</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{f.bookTitle}</td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">{f.accessionNumber}</td>
                  <td className="py-3 px-4 text-muted-foreground">{f.daysOverdue} day(s)</td>
                  <td className="py-3 px-4 font-black text-foreground">₹{f.amount}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        f.status === "Pending"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : f.status === "Paid"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {f.status === "Pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => {
                            setPayingFine(f);
                            setPaymentMethod("Cash");
                            setTransactionRef("");
                          }}
                          className="h-7 px-2.5 text-xs font-bold"
                        >
                          Collect ₹{f.amount}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setWaivingFine(f);
                            setWaiverReason("");
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          Waive
                        </Button>
                      </div>
                    ) : f.status === "Paid" ? (
                      <span className="text-[10px] text-muted-foreground">
                        Paid on {f.paidAt?.split("T")[0]} ({f.paymentMethod})
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground italic">
                        Waived: {f.waiverReason}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Collect Fine Modal */}
      {payingFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Collect Fine Payment</h3>
            <p className="text-xs text-muted-foreground">
              Collecting <span className="font-bold text-foreground">₹{payingFine.amount}</span> from{" "}
              <span className="font-bold text-foreground">{payingFine.memberName}</span>.
            </p>

            <form onSubmit={handlePayConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Payment Method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Card">Debit / Credit Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Receipt / Transaction Ref (Optional)
                </label>
                <input
                  type="text"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  placeholder="e.g. UPI-92817364"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setPayingFine(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isPaying}
                  className="rounded-xl text-xs font-bold"
                >
                  {isPaying ? "Recording Payment..." : `Confirm Payment of ₹${payingFine.amount}`}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Waive Fine Modal */}
      {waivingFine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Waive Fine Penalty</h3>
            <p className="text-xs text-muted-foreground">
              Provide justification for waiving <span className="font-bold text-foreground">₹{waivingFine.amount}</span> penalty for {waivingFine.memberName}.
            </p>

            <form onSubmit={handleWaiveConfirm} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Reason for Waiver *
                </label>
                <textarea
                  rows={2}
                  required
                  value={waiverReason}
                  onChange={(e) => setWaiverReason(e.target.value)}
                  placeholder="e.g. Principal approved medical absence exemption"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setWaivingFine(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isWaiving}
                  className="rounded-xl text-xs font-bold"
                >
                  {isWaiving ? "Waiving..." : "Authorize Waiver"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
