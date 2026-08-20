import React, { useState, useEffect } from "react";
import { Layers, Plus, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelFloors,
  createHostelFloor,
  listHostelBuildings,
  listHostels,
} from "@/services/hostelService";
import type { HostelFloor, HostelBuilding, Hostel } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelFloorsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [floors, setFloors] = useState<HostelFloor[]>([]);
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  // New floor form
  const [selectedBuildingId, setSelectedBuildingId] = useState("");
  const [name, setName] = useState("");
  const [floorNumber, setFloorNumber] = useState(1);
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [hList, bList, fList] = await Promise.all([
        listHostels(organization.id),
        listHostelBuildings(organization.id),
        listHostelFloors(organization.id),
      ]);
      setHostels(hList);
      setBuildings(bList);
      setFloors(fList);
      if (bList.length > 0 && !selectedBuildingId) {
        setSelectedBuildingId(bList[0].id);
      }
    } catch (err: any) {
      console.error("loadFloors error:", err);
      setError(err.message || "Failed to load floors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleCreateFloor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !name.trim() || !selectedBuildingId) return;

    const building = buildings.find((b) => b.id === selectedBuildingId);
    if (!building) return;

    setIsSubmitting(true);
    try {
      await createHostelFloor(
        organization.id,
        {
          hostelId: building.hostelId,
          buildingId: selectedBuildingId,
          buildingName: building.name,
          name: name.trim(),
          floorNumber: Number(floorNumber) || 0,
          description: description.trim(),
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setName("");
      setDescription("");
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to create floor: " + err.message);
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
            Hostel Floors & Levels
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure architectural floors within each hostel building block.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Add Floor"}
        </Button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateFloor}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">New Floor Configuration</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Building Block *</label>
              <select
                value={selectedBuildingId}
                onChange={(e) => setSelectedBuildingId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.hostelName})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Floor Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 1st Floor / Ground Level"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Floor Number *</label>
              <input
                type="number"
                required
                value={floorNumber}
                onChange={(e) => setFloorNumber(parseInt(e.target.value) || 0)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Contains common study hall and water dispenser"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Saving..." : "Save Floor"}
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
      ) : floors.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Layers className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No floors configured</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add floors under your building blocks.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {floors.map((f) => (
            <div
              key={f.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2 text-xs"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{f.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Level: {f.floorNumber}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground">
                Building: <strong className="text-foreground">{f.buildingName}</strong>
              </p>
              {f.description && <p className="text-[10px] text-muted-foreground">{f.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
