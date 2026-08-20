import React, { useState, useEffect, useMemo } from "react";
import {
  Building2,
  Plus,
  Edit2,
  Search,
  RefreshCw,
  AlertCircle,
  BookOpen,
  Globe,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listPublishers,
  createPublisher,
  updatePublisher,
  listBooks,
} from "@/services/libraryService";
import type { LibraryPublisher } from "@/types/library";
import { Button } from "@/components/ui/button";

export const PublishersListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [publishers, setPublishers] = useState<LibraryPublisher[]>([]);
  const [bookCounts, setBookCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingPub, setEditingPub] = useState<LibraryPublisher | null>(null);
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadPublishers = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pubList, books] = await Promise.all([
        listPublishers(organization.id),
        listBooks(organization.id),
      ]);

      const counts: Record<string, number> = {};
      pubList.forEach((p) => (counts[p.id] = 0));
      books.forEach((b) => {
        if (b.publisherId) {
          counts[b.publisherId] = (counts[b.publisherId] || 0) + 1;
        }
      });

      setPublishers(pubList);
      setBookCounts(counts);
    } catch (err: any) {
      console.error("loadPublishers error:", err);
      setError(err.message || "Failed to load publishers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPublishers();
  }, [organization]);

  const openCreateModal = () => {
    setEditingPub(null);
    setName("");
    setContact("");
    setWebsite("");
    setStatus("Active");
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (pub: LibraryPublisher) => {
    setEditingPub(pub);
    setName(pub.name);
    setContact(pub.contact || "");
    setWebsite(pub.website || "");
    setStatus(pub.status);
    setModalError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!name.trim()) {
      setModalError("Publisher name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingPub) {
        await updatePublisher(
          organization.id,
          editingPub.id,
          {
            name: name.trim(),
            contact: contact.trim() || null,
            website: website.trim() || null,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      } else {
        await createPublisher(
          organization.id,
          {
            name: name.trim(),
            contact: contact.trim() || null,
            website: website.trim() || null,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      }
      setShowModal(false);
      await loadPublishers();
    } catch (err: any) {
      setModalError(err.message || "Failed to save publisher.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPublishers = useMemo(() => {
    return publishers.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [publishers, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Book Publishers & Presses
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage academic publishers, contacts, and publication sources.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={openCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Publisher
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search publisher..."
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
          <Button onClick={loadPublishers} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredPublishers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Building2 className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No publishers found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add publishing houses like "Oxford University Press", "Pearson", "McGraw Hill" etc.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Add Publisher
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredPublishers.map((pub) => (
            <div
              key={pub.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-extrabold text-sm text-foreground">{pub.name}</h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    pub.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {pub.status}
                </span>
              </div>

              {pub.contact && (
                <p className="text-xs text-muted-foreground">{pub.contact}</p>
              )}

              {pub.website && (
                <div className="flex items-center gap-1 text-[11px] text-primary">
                  <Globe className="size-3" />
                  <a href={pub.website} target="_blank" rel="noopener noreferrer" className="hover:underline truncate">
                    {pub.website}
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between border-t border-border pt-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <BookOpen className="size-3.5 text-primary" />
                  <span className="font-semibold text-foreground">
                    {bookCounts[pub.id] || 0} Title(s)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(pub)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="size-3.5 mr-1 text-muted-foreground" /> Edit
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Publisher Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {editingPub ? "Edit Publisher" : "Add Publisher"}
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
                  Publisher Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Cambridge University Press"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Contact / Email</label>
                <input
                  type="text"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder="e.g. contact@cup.org"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="e.g. https://www.cambridge.org"
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
                  {isSubmitting ? "Saving..." : "Save Publisher"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
