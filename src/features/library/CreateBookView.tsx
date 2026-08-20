import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  Layers,
  Users,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createBook,
  listCategories,
  listAuthors,
  listPublishers,
} from "@/services/libraryService";
import type {
  LibraryCategory,
  LibraryAuthor,
  LibraryPublisher,
  BookFormat,
} from "@/types/library";
import type { LibraryBookInput } from "@/schemas/library";
import { Button } from "@/components/ui/button";

export const CreateBookView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [authors, setAuthors] = useState<LibraryAuthor[]>([]);
  const [publishers, setPublishers] = useState<LibraryPublisher[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form Fields
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [isbn, setIsbn] = useState("");
  const [language, setLanguage] = useState("English");
  const [edition, setEdition] = useState("");
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  const [description, setDescription] = useState("");

  const [categoryId, setCategoryId] = useState("");
  const [authorId, setAuthorId] = useState("");
  const [publisherId, setPublisherId] = useState("");
  const [subject, setSubject] = useState("");

  const [totalCopies, setTotalCopies] = useState<number>(1);
  const [shelf, setShelf] = useState("");
  const [rack, setRack] = useState("");
  const [location, setLocation] = useState("");
  const [format, setFormat] = useState<BookFormat>("Physical");

  const [issueAllowed, setIssueAllowed] = useState(true);
  const [renewalAllowed, setRenewalAllowed] = useState(true);
  const [maximumRenewals, setMaximumRenewals] = useState<number>(2);
  const [loanDurationDays, setLoanDurationDays] = useState<number>(14);
  const [fineApplicable, setFineApplicable] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [cats, auths, pubs] = await Promise.all([
          listCategories(organization.id),
          listAuthors(organization.id),
          listPublishers(organization.id),
        ]);
        setCategories(cats);
        setAuthors(auths);
        setPublishers(pubs);

        if (cats.length > 0) setCategoryId(cats[0].id);
        if (auths.length > 0) setAuthorId(auths[0].id);
        if (pubs.length > 0) setPublisherId(pubs[0].id);
      } catch (err: any) {
        console.error("Init create book error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!title.trim()) {
      setError("Book title is required.");
      return;
    }
    if (!categoryId || !authorId) {
      setError("Please select a valid Category and Author.");
      return;
    }
    if (totalCopies < 1) {
      setError("Total copies must be at least 1.");
      return;
    }

    const catObj = categories.find((c) => c.id === categoryId);
    const authObj = authors.find((a) => a.id === authorId);
    const pubObj = publishers.find((p) => p.id === publisherId);

    const input: LibraryBookInput = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      isbn: isbn.trim() || null,
      language: language.trim() || "English",
      edition: edition.trim() || null,
      publicationYear: publicationYear ? Number(publicationYear) : null,
      description: description.trim() || null,
      categoryId,
      categoryName: catObj?.name || "General",
      authorId,
      authorName: authObj?.name || "Author",
      publisherId: publisherId || null,
      publisherName: pubObj?.name || null,
      subject: subject.trim() || null,
      tags: [],
      format,
      totalCopies: Number(totalCopies),
      shelf: shelf.trim() || null,
      rack: rack.trim() || null,
      location: location.trim() || null,
      issueAllowed,
      renewalAllowed,
      maximumRenewals: Number(maximumRenewals),
      loanDurationDays: Number(loanDurationDays),
      fineApplicable,
      status: "Active",
    };

    setIsSubmitting(true);
    try {
      const created = await createBook(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      navigate({ to: "/library/books/$bookId", params: { bookId: created.id } });
    } catch (err: any) {
      console.error("Create book error:", err);
      setError(err.message || "Failed to create book record.");
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/library/books">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Register New Book
            </h1>
            <p className="text-xs text-muted-foreground">
              Add catalog metadata and generate unique physical copy accession numbers.
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

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION A: Book Information */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">Section A: Title & Metadata</h2>
            <p className="text-xs text-muted-foreground">Core publication and edition details</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-foreground mb-1">
                Book Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Fundamentals of Modern Physics"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Concepts & Applications"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                ISBN (10 or 13 digits)
              </label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                placeholder="e.g. 978-0131103627"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Language</label>
              <input
                type="text"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                placeholder="e.g. English"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Edition</label>
              <input
                type="text"
                value={edition}
                onChange={(e) => setEdition(e.target.value)}
                placeholder="e.g. 4th Edition"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Publication Year
              </label>
              <input
                type="number"
                value={publicationYear}
                onChange={(e) => setPublicationYear(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Description / Synopsis
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of the book content"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* SECTION B: Classification */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section B: Classification & Authorship
            </h2>
            <p className="text-xs text-muted-foreground">Catalog indexing and attribution</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Category *</label>
                <Link to="/library/categories" className="text-[10px] text-primary font-bold hover:underline">
                  + New
                </Link>
              </div>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Select Category
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Primary Author *</label>
                <Link to="/library/authors" className="text-[10px] text-primary font-bold hover:underline">
                  + New
                </Link>
              </div>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="" disabled>
                  Select Author
                </option>
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-foreground">Publisher</label>
                <Link to="/library/publishers" className="text-[10px] text-primary font-bold hover:underline">
                  + New
                </Link>
              </div>
              <select
                value={publisherId}
                onChange={(e) => setPublisherId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None Selected</option>
                {publishers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* SECTION C: Inventory & Placement */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section C: Physical Copies & Shelf Placement
            </h2>
            <p className="text-xs text-muted-foreground">
              Stock quantity and location mapping in the library hall
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Number of Copies *
              </label>
              <input
                type="number"
                min={1}
                max={500}
                required
                value={totalCopies}
                onChange={(e) => setTotalCopies(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Shelf</label>
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                placeholder="e.g. Shelf A-3"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Rack</label>
              <input
                type="text"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
                placeholder="e.g. Rack 12"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Format</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Physical">Physical Hardcopy</option>
                <option value="Reference">Reference Only</option>
                <option value="Digital">Digital / E-Book</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* SECTION D: Circulation Rules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section D: Circulation & Loan Rules
            </h2>
            <p className="text-xs text-muted-foreground">Borrowing policies and fine configurations</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="issueAllowed"
                checked={issueAllowed}
                onChange={(e) => setIssueAllowed(e.target.checked)}
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="issueAllowed" className="text-xs font-semibold text-foreground cursor-pointer">
                Allow Borrowing / Loan Out
              </label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="renewalAllowed"
                checked={renewalAllowed}
                onChange={(e) => setRenewalAllowed(e.target.checked)}
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="renewalAllowed" className="text-xs font-semibold text-foreground cursor-pointer">
                Allow Loan Renewals
              </label>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Loan Duration (Days)
              </label>
              <input
                type="number"
                min={1}
                max={90}
                value={loanDurationDays}
                onChange={(e) => setLoanDurationDays(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Maximum Renewals Allowed
              </label>
              <input
                type="number"
                min={0}
                max={10}
                value={maximumRenewals}
                onChange={(e) => setMaximumRenewals(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/library/books">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Generating Book & Copies..." : "Save & Register Book"}
          </Button>
        </div>
      </form>
    </div>
  );
};
