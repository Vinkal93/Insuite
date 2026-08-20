import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowLeft,
  Edit2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  BookMarked,
  Bookmark,
  Layers,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getBook,
  listBookCopies,
  listTransactions,
  listReservations,
  addBookCopy,
} from "@/services/libraryService";
import type {
  LibraryBook,
  LibraryBookCopy,
  LibraryTransaction,
  LibraryReservation,
} from "@/types/library";
import { Button } from "@/components/ui/button";

export const BookDetailView: React.FC = () => {
  const { bookId } = useParams({ from: "/library/books/$bookId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [book, setBook] = useState<LibraryBook | null>(null);
  const [copies, setCopies] = useState<LibraryBookCopy[]>([]);
  const [transactions, setTransactions] = useState<LibraryTransaction[]>([]);
  const [reservations, setReservations] = useState<LibraryReservation[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "copies" | "loans" | "reservations">(
    "overview"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add Copy Modal State
  const [showAddCopyModal, setShowAddCopyModal] = useState(false);
  const [copyCondition, setCopyCondition] = useState<any>("New");
  const [copyShelf, setCopyShelf] = useState("");
  const [copyRack, setCopyRack] = useState("");
  const [isAddingCopy, setIsAddingCopy] = useState(false);

  const loadData = async () => {
    if (!organization || !bookId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [b, cList, tList, rList] = await Promise.all([
        getBook(organization.id, bookId),
        listBookCopies(organization.id, bookId),
        listTransactions(organization.id, { bookId }),
        listReservations(organization.id),
      ]);
      setBook(b);
      setCopies(cList);
      setTransactions(tList);
      setReservations(rList.filter((r) => r.bookId === bookId));
    } catch (err: any) {
      console.error("Book detail load error:", err);
      setError(err.message || "Failed to load book record.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, bookId]);

  const handleAddCopy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !bookId) return;

    setIsAddingCopy(true);
    try {
      await addBookCopy(
        organization.id,
        bookId,
        {
          condition: copyCondition,
          shelf: copyShelf.trim() || null,
          rack: copyRack.trim() || null,
          status: "Available",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowAddCopyModal(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to add copy: " + err.message);
    } finally {
      setIsAddingCopy(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !book) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Book Title Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The book ID does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/library/books">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Catalog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <BookOpen className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{book.title}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {book.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-surface text-muted-foreground border-border">
                  {book.format}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                by <span className="font-bold text-foreground">{book.authorName}</span> • {book.categoryName}
              </p>
              <p className="font-mono text-xs text-primary font-semibold mt-1">
                ISBN: {book.isbn || "Not Assigned"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/library/books/$bookId/edit" params={{ bookId: book.id }}>
                <Edit2 className="size-3.5 mr-1" /> Edit Book
              </Link>
            </Button>
            <Button variant="hero" size="sm" asChild className="rounded-xl text-xs h-8 font-bold">
              <Link to="/library/transactions/issue">
                <BookMarked className="size-3.5 mr-1" /> Issue Copy
              </Link>
            </Button>
          </div>
        </div>

        {/* Copy Availability Ribbon */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Stock</span>
            <p className="text-lg font-black text-foreground mt-0.5">{book.totalCopies} Copies</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-emerald-600 uppercase font-bold">Available Now</span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              {book.availableCopies} Copies
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-primary uppercase font-bold">Currently Issued</span>
            <p className="text-lg font-black text-primary mt-0.5">{book.issuedCopies} Copies</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Placement</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {book.shelf ? `${book.shelf} / ${book.rack || ""}` : "General Stacks"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("copies")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "copies"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Physical Copies ({copies.length})
          </button>
          <button
            onClick={() => setActiveTab("loans")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "loans"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Loan History ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab("reservations")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "reservations"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Reservations ({reservations.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Book Details & Description
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {book.description || "No description provided for this title."}
            </p>
            <dl className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <dt className="text-[10px] text-muted-foreground">Language</dt>
                <dd className="font-semibold text-foreground">{book.language || "English"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Edition</dt>
                <dd className="font-semibold text-foreground">{book.edition || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Publisher</dt>
                <dd className="font-semibold text-foreground">{book.publisherName || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Publication Year</dt>
                <dd className="font-semibold text-foreground">{book.publicationYear || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Circulation Rules
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Borrowing Allowed</span>
                <span className="font-bold text-foreground">
                  {book.issueAllowed ? "Yes" : "Reference Only"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Loan Period</span>
                <span className="font-bold text-foreground">{book.loanDurationDays} Days</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Renewals Allowed</span>
                <span className="font-bold text-foreground">
                  {book.renewalAllowed ? `Up to ${book.maximumRenewals} times` : "No"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Overdue Fine Applicable</span>
                <span className="font-bold text-foreground">
                  {book.fineApplicable ? "Yes" : "Exempt"}
                </span>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Tab 2: Copies */}
      {activeTab === "copies" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Physical Copy Inventory</h2>
              <p className="text-xs text-muted-foreground">
                Individually barcoded copies and accession records
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddCopyModal(true)}
              className="rounded-xl text-xs h-8 font-semibold"
            >
              <Plus className="size-3.5 mr-1" /> Add Copy
            </Button>
          </div>

          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-2.5 px-4">Accession Number</th>
                  <th className="py-2.5 px-4">Condition</th>
                  <th className="py-2.5 px-4">Placement</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {copies.map((copy) => (
                  <tr key={copy.id} className="hover:bg-surface/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-primary">
                      {copy.accessionNumber}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">{copy.condition}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {copy.shelf || book.shelf || "—"} / {copy.rack || book.rack || "—"}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          copy.status === "Available"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : copy.status === "Issued"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {copy.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Loans */}
      {activeTab === "loans" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Circulation & Loan History
          </h2>
          {transactions.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No loan transactions recorded for this book yet.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Borrower</th>
                    <th className="py-2.5 px-4">Accession</th>
                    <th className="py-2.5 px-4">Issue Date</th>
                    <th className="py-2.5 px-4">Due Date</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t) => (
                    <tr key={t.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-bold text-foreground">{t.memberName}</td>
                      <td className="py-2.5 px-4 font-mono text-primary font-bold">
                        {t.accessionNumber}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{t.issuedAt.split("T")[0]}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{t.dueAt}</td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Reservations */}
      {activeTab === "reservations" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Active Reservation Queue
          </h2>
          {reservations.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No active reservations for this book title.
            </p>
          ) : (
            <div className="space-y-3">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{r.memberName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Reserved on: {r.reservedAt.split("T")[0]} (Expires: {r.expiresAt.split("T")[0]})
                    </p>
                  </div>
                  <span className="text-xs font-black text-primary">Queue #{r.queuePosition}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Copy Modal */}
      {showAddCopyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Add Physical Copy</h3>
            <p className="text-xs text-muted-foreground">
              Assign an automatic accession number for a new physical inventory item.
            </p>

            <form onSubmit={handleAddCopy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Condition</label>
                <select
                  value={copyCondition}
                  onChange={(e) => setCopyCondition(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Shelf</label>
                  <input
                    type="text"
                    value={copyShelf}
                    onChange={(e) => setCopyShelf(e.target.value)}
                    placeholder={book.shelf || "Shelf A-1"}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Rack</label>
                  <input
                    type="text"
                    value={copyRack}
                    onChange={(e) => setCopyRack(e.target.value)}
                    placeholder={book.rack || "Rack 4"}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddCopyModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isAddingCopy}
                  className="rounded-xl text-xs font-bold"
                >
                  {isAddingCopy ? "Adding..." : "Add Copy to Inventory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
