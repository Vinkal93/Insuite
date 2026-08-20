import React, { useState, useEffect, useMemo } from "react";
import {
  Users,
  Plus,
  Edit2,
  Search,
  RefreshCw,
  AlertCircle,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAuthors,
  createAuthor,
  updateAuthor,
  listBooks,
} from "@/services/libraryService";
import type { LibraryAuthor } from "@/types/library";
import { Button } from "@/components/ui/button";

export const AuthorsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [authors, setAuthors] = useState<LibraryAuthor[]>([]);
  const [bookCounts, setBookCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingAuth, setEditingAuth] = useState<LibraryAuthor | null>(null);
  const [name, setName] = useState("");
  const [biography, setBiography] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadAuthors = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [authList, books] = await Promise.all([
        listAuthors(organization.id),
        listBooks(organization.id),
      ]);

      const counts: Record<string, number> = {};
      authList.forEach((a) => (counts[a.id] = 0));
      books.forEach((b) => {
        if (b.authorId) {
          counts[b.authorId] = (counts[b.authorId] || 0) + 1;
        }
      });

      setAuthors(authList);
      setBookCounts(counts);
    } catch (err: any) {
      console.error("loadAuthors error:", err);
      setError(err.message || "Failed to load authors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAuthors();
  }, [organization]);

  const openCreateModal = () => {
    setEditingAuth(null);
    setName("");
    setBiography("");
    setStatus("Active");
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (auth: LibraryAuthor) => {
    setEditingAuth(auth);
    setName(auth.name);
    setBiography(auth.biography || "");
    setStatus(auth.status);
    setModalError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!name.trim()) {
      setModalError("Author name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingAuth) {
        await updateAuthor(
          organization.id,
          editingAuth.id,
          {
            name: name.trim(),
            biography: biography.trim() || null,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      } else {
        await createAuthor(
          organization.id,
          {
            name: name.trim(),
            biography: biography.trim() || null,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      }
      setShowModal(false);
      await loadAuthors();
    } catch (err: any) {
      setModalError(err.message || "Failed to save author.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAuthors = useMemo(() => {
    return authors.filter((a) => a.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [authors, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Book Authors & Contributors
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage author profiles and indexed book attributions.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={openCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Author
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search author name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
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
          <Button onClick={loadAuthors} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredAuthors.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No authors found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Register authors like "William Shakespeare", "Stephen Hawking" etc.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Add Author
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredAuthors.map((auth) => (
            <div
              key={auth.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-extrabold text-sm text-foreground">{auth.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    auth.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {auth.status}
                </span>
              </div>

              {auth.biography && (
                <p className="text-xs text-muted-foreground line-clamp-2">{auth.biography}</p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {bookCounts[auth.id] || 0} Title(s)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(auth)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="size-3.5 mr-1 text-muted-foreground" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Author Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {editingAuth ? "Edit Author" : "Add Author"}
            </h3>

            {modalError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Author Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Richard Feynman"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Biography / Summary
                </label>
                <textarea
                  rows={2}
                  value={biography}
                  onChange={(e) => setBiography(e.target.value)}
                  placeholder="Short author background"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Saving..." : "Save Author"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
