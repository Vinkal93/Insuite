import React, { useState, useEffect } from "react";
import { Building2, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelBuildings,
  createHostelBuilding,
  listHostels,
} from "@/services/hostelService";
import type { HostelBuilding, Hostel } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelBuildingsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // New building form
  const [selectedHostelId, setSelectedHostelId] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [hList, bList] = await Promise.all([
        listHostels(organization.id),
        listHostelBuildings(organization.id),
      ]);
      setHostels(hList);
      setBuildings(bList);
      if (hList.length > 0 && !selectedHostelId) {
        setSelectedHostelId(hList[0].id);
      }
    } catch (err: any) {
      console.error("loadBuildings error:", err);
      setError(err.message || "Failed to load buildings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleCreateBuilding = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !name.trim() || !code.trim() || !selectedHostelId) {
      return;
    }

    const hostel = hostels.find((h) => h.id === selectedHostelId);
    if (!hostel) return;

    setIsSubmitting(true);
    try {
      await createHostelBuilding(
        organization.id,
        {
          hostelId: selectedHostelId,
          hostelName: hostel.name,
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim(),
          status: "Active",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setName("");
      setCode("");
      setDescription("");
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to create building: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Buildings & Blocks
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage architectural blocks, towers, and wings associated with residential hostels.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Add Building Block"}
        </Button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateBuilding}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">New Building Block</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Parent Hostel *</label>
              <select
                value={selectedHostelId}
                onChange={(e) => setSelectedHostelId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.type})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Building Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Block A (Senior Wing)"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Building Code *</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. BLK-A"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none uppercase"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 4 floors, 32 double occupancy rooms"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !name.trim() || !code.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Saving..." : "Save Building"}
            </Button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : buildings.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Building2 className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No buildings configured</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add building blocks under your hostels.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {buildings.map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{b.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">Code: {b.code}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                  {b.status}
                </span>
              </div>

              <p className="text-[11px] text-muted-foreground">Hostel: <strong className="text-foreground">{b.hostelName}</strong></p>
              {b.description && <p className="text-[10px] text-muted-foreground">{b.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
