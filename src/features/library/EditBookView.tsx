import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getBook,
  updateBook,
  listCategories,
  listAuthors,
  listPublishers,
} from "@/services/libraryService";
import type {
  LibraryBook,
  LibraryCategory,
  LibraryAuthor,
  LibraryPublisher,
  BookFormat,
} from "@/types/library";
import { Button } from "@/components/ui/button";

export const EditBookView: React.FC = () => {
  const { bookId } = useParams({ from: "/library/books/$bookId/edit" });
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [book, setBook] = useState<LibraryBook | null>(null);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [authors, setAuthors] = useState<LibraryAuthor[]>([]);
  const [publishers, setPublishers] = useState<LibraryPublisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const [shelf, setShelf] = useState("");
  const [rack, setRack] = useState("");
  const [format, setFormat] = useState<BookFormat>("Physical");

  const [issueAllowed, setIssueAllowed] = useState(true);
  const [renewalAllowed, setRenewalAllowed] = useState(true);
  const [maximumRenewals, setMaximumRenewals] = useState<number>(2);
  const [loanDurationDays, setLoanDurationDays] = useState<number>(14);
  const [fineApplicable, setFineApplicable] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (!organization || !bookId) return;
      try {
        const [b, cats, auths, pubs] = await Promise.all([
          getBook(organization.id, bookId),
          listCategories(organization.id),
          listAuthors(organization.id),
          listPublishers(organization.id),
        ]);
        if (!b) {
          setError("Book record not found.");
          return;
        }
        setBook(b);
        setCategories(cats);
        setAuthors(auths);
        setPublishers(pubs);

        setTitle(b.title);
        setSubtitle(b.subtitle || "");
        setIsbn(b.isbn || "");
        setLanguage(b.language || "English");
        setEdition(b.edition || "");
        setPublicationYear(b.publicationYear || new Date().getFullYear());
        setDescription(b.description || "");

        setCategoryId(b.categoryId);
        setAuthorId(b.authorId);
        setPublisherId(b.publisherId || "");
        setSubject(b.subject || "");

        setShelf(b.shelf || "");
        setRack(b.rack || "");
        setFormat(b.format || "Physical");

        setIssueAllowed(b.issueAllowed);
        setRenewalAllowed(b.renewalAllowed);
        setMaximumRenewals(b.maximumRenewals);
        setLoanDurationDays(b.loanDurationDays);
        setFineApplicable(b.fineApplicable);
      } catch (err: any) {
        setError(err.message || "Failed to load book for editing.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [organization, bookId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !bookId) return;
    setError(null);

    const catObj = categories.find((c) => c.id === categoryId);
    const authObj = authors.find((a) => a.id === authorId);
    const pubObj = publishers.find((p) => p.id === publisherId);

    setIsSubmitting(true);
    try {
      await updateBook(
        organization.id,
        bookId,
        {
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
          shelf: shelf.trim() || null,
          rack: rack.trim() || null,
          format,
          issueAllowed,
          renewalAllowed,
          maximumRenewals: Number(maximumRenewals),
          loanDurationDays: Number(loanDurationDays),
          fineApplicable,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/library/books/$bookId", params: { bookId } });
    } catch (err: any) {
      setError(err.message || "Failed to update book record.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error && !book) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
        <Button variant="outline" size="sm" asChild className="mt-3 text-xs">
          <Link to="/library/books">Return</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/library/books/$bookId" params={{ bookId: book!.id }}>
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Edit Book Details
            </h1>
            <p className="text-xs text-muted-foreground">
              Update catalog metadata, shelf placement, and borrowing parameters.
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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Title & Attribution
          </h2>

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
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Subtitle</label>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">ISBN</label>
              <input
                type="text"
                value={isbn}
                onChange={(e) => setIsbn(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category *</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Author *</label>
              <select
                value={authorId}
                onChange={(e) => setAuthorId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {authors.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Publisher</label>
              <select
                value={publisherId}
                onChange={(e) => setPublisherId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None</option>
                {publishers.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Shelf & Loan Rules
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Shelf</label>
              <input
                type="text"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Rack</label>
              <input
                type="text"
                value={rack}
                onChange={(e) => setRack(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
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
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/library/books/$bookId" params={{ bookId: book!.id }}>
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving Changes..." : "Save Book Updates"}
          </Button>
        </div>
      </form>
    </div>
  );
};
