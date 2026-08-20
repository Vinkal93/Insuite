import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  BookMarked,
  ArrowLeft,
  Search,
  UserCheck,
  BookOpen,
  Calendar,
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Briefcase,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  searchLibraryMembers,
  listBooks,
  listBookCopies,
  issueBook,
  getLibrarySettings,
} from "@/services/libraryService";
import type {
  LibraryMember,
  LibraryBook,
  LibraryBookCopy,
  LibrarySettingsConfig,
} from "@/types/library";
import { Button } from "@/components/ui/button";

export const IssueBookView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [members, setMembers] = useState<LibraryMember[]>([]);
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [settings, setSettings] = useState<LibrarySettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Selection states
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMember, setSelectedMember] = useState<LibraryMember | null>(null);

  const [bookSearch, setBookSearch] = useState("");
  const [selectedBook, setSelectedBook] = useState<LibraryBook | null>(null);
  const [bookCopies, setBookCopies] = useState<LibraryBookCopy[]>([]);
  const [selectedCopyId, setSelectedCopyId] = useState("");

  const [dueDate, setDueDate] = useState("");
  const [remarks, setRemarks] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [mList, bList, st] = await Promise.all([
          searchLibraryMembers(organization.id),
          listBooks(organization.id, { status: "Active" }),
          getLibrarySettings(organization.id),
        ]);
        setMembers(mList);
        setBooks(bList);
        setSettings(st);

        // Precalculate due date
        const due = new Date();
        due.setDate(due.getDate() + (st.defaultLoanDurationDays || 14));
        setDueDate(due.toISOString().split("T")[0]);
      } catch (err: any) {
        console.error("Init issue book error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [organization]);

  // When book changes, load copies
  const handleSelectBook = async (b: LibraryBook) => {
    if (!organization) return;
    setSelectedBook(b);
    setSelectedCopyId("");
    try {
      const copies = await listBookCopies(organization.id, b.id);
      const available = copies.filter((c) => c.status === "Available");
      setBookCopies(available);
      if (available.length > 0) {
        setSelectedCopyId(available[0].id);
      }
    } catch (err) {
      console.error("Load copies error:", err);
    }
  };

  const filteredMembers = useMemo(() => {
    if (!memberSearch.trim()) return members.slice(0, 5);
    const q = memberSearch.toLowerCase();
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.identifier.toLowerCase().includes(q) ||
        m.departmentOrClass.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [members, memberSearch]);

  const filteredBooks = useMemo(() => {
    if (!bookSearch.trim()) return books.slice(0, 5);
    const q = bookSearch.toLowerCase();
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        (b.isbn && b.isbn.toLowerCase().includes(q)) ||
        b.authorName.toLowerCase().includes(q)
    ).slice(0, 8);
  }, [books, bookSearch]);

  const maxLimit =
    selectedMember?.memberType === "Staff"
      ? settings?.staffLoanLimit || 6
      : settings?.studentLoanLimit || 3;

  const isMemberOverLimit =
    selectedMember && selectedMember.booksIssuedCount >= maxLimit;

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!selectedMember) {
      setError("Please select a borrower member.");
      return;
    }
    if (!selectedBook || !selectedCopyId) {
      setError("Please select a book and an available physical copy.");
      return;
    }
    if (isMemberOverLimit) {
      setError(`Member has reached borrowing limit of ${maxLimit} books.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await issueBook(
        organization.id,
        {
          bookId: selectedBook.id,
          copyId: selectedCopyId,
          memberType: selectedMember.memberType,
          memberId: selectedMember.id,
          dueAt: dueDate,
          remarks: remarks.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/library/transactions" });
    } catch (err: any) {
      setError(err.message || "Failed to issue book copy.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/library/transactions">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Issue Book to Member
            </h1>
            <p className="text-xs text-muted-foreground">
              Select verified borrower, assign available physical copy, and record loan due date.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleIssueSubmit} className="space-y-6">
        {/* Step 1: Member Selection */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Step 1: Select Borrower</h2>
              <p className="text-xs text-muted-foreground">Student or faculty member</p>
            </div>
            {selectedMember && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Selected
              </span>
            )}
          </div>

          {!selectedMember ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search borrower by name, ID number, or class..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {filteredMembers.map((m) => (
                  <button
                    key={`${m.memberType}_${m.id}`}
                    type="button"
                    onClick={() => setSelectedMember(m)}
                    className="rounded-2xl border border-border bg-surface/50 p-3 text-left hover:bg-surface hover:border-primary/40 transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">{m.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {m.memberType} • {m.identifier} ({m.departmentOrClass})
                      </p>
                    </div>
                    <span className="text-[10px] text-primary font-semibold">
                      {m.booksIssuedCount} Loan(s)
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
              <div>
                <p className="font-bold text-sm text-foreground">{selectedMember.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedMember.memberType} • ID: {selectedMember.identifier} (
                  {selectedMember.departmentOrClass})
                </p>
                <p className="text-xs font-semibold text-primary mt-1">
                  Active Loans: {selectedMember.booksIssuedCount} / {maxLimit} allowed
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedMember(null)}
                className="rounded-xl text-xs h-8"
              >
                Change Borrower
              </Button>
            </div>
          )}
        </div>

        {/* Step 2: Book Selection */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Step 2: Select Book Title</h2>
              <p className="text-xs text-muted-foreground">Search and pick available title</p>
            </div>
            {selectedBook && (
              <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="size-3.5" /> Selected
              </span>
            )}
          </div>

          {!selectedBook ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search book by title, ISBN, or author..."
                  value={bookSearch}
                  onChange={(e) => setBookSearch(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                {filteredBooks.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBook(b)}
                    className="rounded-2xl border border-border bg-surface/50 p-3 text-left hover:bg-surface hover:border-primary/40 transition-all flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">{b.title}</p>
                      <p className="text-[10px] text-muted-foreground">
                        by {b.authorName} • {b.categoryName}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600">
                      {b.availableCopies} Avail
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-sm text-foreground">{selectedBook.title}</p>
                  <p className="text-xs text-muted-foreground">
                    by {selectedBook.authorName} • Category: {selectedBook.categoryName}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedBook(null);
                    setBookCopies([]);
                    setSelectedCopyId("");
                  }}
                  className="rounded-xl text-xs h-8"
                >
                  Change Book
                </Button>
              </div>

              {/* Physical Copy Selector */}
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Available Copy (Accession Number) *
                </label>
                {bookCopies.length === 0 ? (
                  <p className="text-xs text-destructive font-bold p-2 bg-destructive/5 rounded-xl border border-destructive/20">
                    No physical copies currently available for this title.
                  </p>
                ) : (
                  <select
                    value={selectedCopyId}
                    onChange={(e) => setSelectedCopyId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {bookCopies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.accessionNumber} — Condition: {c.condition} (Shelf: {c.shelf || "General"})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Step 3: Loan Parameters */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">Step 3: Loan Due Date & Notes</h2>
            <p className="text-xs text-muted-foreground">Set expected return date</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Due Return Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Issue Remarks
              </label>
              <input
                type="text"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="e.g. For semester assignment"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/library/transactions">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !selectedMember || !selectedBook || !selectedCopyId}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Issuing Book Copy..." : "Confirm & Issue Book"}
          </Button>
        </div>
      </form>
    </div>
  );
};
