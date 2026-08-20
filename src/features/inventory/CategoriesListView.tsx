import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listCategories,
  createCategory,
  updateCategory,
} from "@/services/inventoryService";
import type { InventoryCategory, ItemCategoryType } from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const CategoriesListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [type, setType] = useState<ItemCategoryType>("Consumable");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadCategories = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listCategories(organization.id);
      setCategories(data);
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
    setEditingCategory(null);
    setName("");
    setCode("");
    setType("Consumable");
    setDescription("");
    setStatus("Active");
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (c: InventoryCategory) => {
    setEditingCategory(c);
    setName(c.name);
    setCode(c.code);
    setType(c.type);
    setDescription(c.description || "");
    setStatus(c.status);
    setModalError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!name.trim() || !code.trim()) {
      setModalError("Category name and code are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(
          organization.id,
          editingCategory.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase(),
            type,
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
            code: code.trim().toUpperCase(),
            type,
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
            Inventory & Asset Categories
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Classify consumable stock and fixed capital assets.
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
            Create categories for stationery, IT equipment, lab glassware, or sports goods.
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
          {categories.map((c) => (
            <div
              key={c.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{c.name}</h3>
                  <span className="font-mono text-[10px] text-primary font-bold">{c.code}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    c.type === "Fixed Asset"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                  }`}
                >
                  {c.type}
                </span>
              </div>

              {c.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <span
                  className={`text-[10px] font-bold ${
                    c.status === "Active" ? "text-emerald-600" : "text-muted-foreground"
                  }`}
                >
                  ● {c.status}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(c)}
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
              {editingCategory ? "Edit Category" : "Add Inventory Category"}
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
                  placeholder="e.g. Science Laboratory Apparatus"
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
                    placeholder="e.g. LAB-APP"
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Classification Type *
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Consumable">Consumable Supplies</option>
                    <option value="Fixed Asset">Fixed Capital Asset</option>
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
                  placeholder="e.g. Beakers, test tubes, reagents, and chemicals"
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
