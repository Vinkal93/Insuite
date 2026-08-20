import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listCategories,
  createCategory,
  updateCategory,
  listBooks,
} from "@/services/libraryService";
import type { LibraryCategory } from "@/types/library";
import { Button } from "@/components/ui/button";

export const CategoriesListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [bookCounts, setBookCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCat, setEditingCat] = useState<LibraryCategory | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadCategories = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [cats, books] = await Promise.all([
        listCategories(organization.id),
        listBooks(organization.id),
      ]);

      const counts: Record<string, number> = {};
      cats.forEach((c) => (counts[c.id] = 0));
      books.forEach((b) => {
        if (b.categoryId) {
          counts[b.categoryId] = (counts[b.categoryId] || 0) + 1;
        }
      });

      setCategories(cats);
      setBookCounts(counts);
    } catch (err: any) {
      console.error("loadCategories error:", err);
      setError(err.message || "Failed to load categories.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [organization]);

  const openCreateModal = () => {
    setEditingCat(null);
    setName("");
    setCode("");
    setDescription("");
    setStatus("Active");
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (cat: LibraryCategory) => {
    setEditingCat(cat);
    setName(cat.name);
    setCode(cat.code);
    setDescription(cat.description || "");
    setStatus(cat.status);
    setModalError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!name.trim() || !code.trim()) {
      setModalError("Category Name and Code are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCat) {
        await updateCategory(
          organization.id,
          editingCat.id,
          {
            name: name.trim(),
            code: code.trim(),
            description: description.trim() || null,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      } else {
        await createCategory(
          organization.id,
          {
            name: name.trim(),
            code: code.trim(),
            description: description.trim() || null,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      }
      setShowModal(false);
      await loadCategories();
    } catch (err: any) {
      setModalError(err.message || "Failed to save category.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Book Categories & Classification
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organize catalog inventory into academic subjects and genre classifications.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={openCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Category
        </Button>
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
          <Button onClick={loadCategories} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Layers className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No categories defined yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add subject genres like "Computer Science", "Fiction", "History" etc.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Add Category
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{cat.name}</h3>
                  <span className="font-mono text-[10px] text-primary font-bold">{cat.code}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    cat.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {cat.status}
                </span>
              </div>

              {cat.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{cat.description}</p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {bookCounts[cat.id] || 0} Book Title(s)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(cat)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="size-3.5 mr-1 text-muted-foreground" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Category Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {editingCat ? "Edit Category" : "Add Book Category"}
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
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mathematics & Statistics"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. MATH"
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Classification details and scope"
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
                  {isSubmitting ? "Saving..." : "Save Category"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
