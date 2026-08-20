import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bed,
  Plus,
  Search,
  Filter,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelRooms,
  createHostelRoom,
  listHostels,
  listHostelBuildings,
  listHostelFloors,
} from "@/services/hostelService";
import type { HostelRoom, Hostel, HostelBuilding, HostelFloor } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelRoomsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [rooms, setRooms] = useState<HostelRoom[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [buildings, setBuildings] = useState<HostelBuilding[]>([]);
  const [floors, setFloors] = useState<HostelFloor[]>([]);

  const [selectedHostelFilter, setSelectedHostelFilter] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // New Room Form
  const [formHostelId, setFormHostelId] = useState("");
  const [formBuildingId, setFormBuildingId] = useState("");
  const [formFloorId, setFormFloorId] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [roomType, setRoomType] = useState("Double Occupancy");
  const [capacity, setCapacity] = useState(2);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [rList, hList, bList, fList] = await Promise.all([
        listHostelRooms(organization.id, { hostelId: selectedHostelFilter || undefined }),
        listHostels(organization.id),
        listHostelBuildings(organization.id),
        listHostelFloors(organization.id),
      ]);
      setRooms(rList);
      setHostels(hList);
      setBuildings(bList);
      setFloors(fList);

      if (hList.length > 0 && !formHostelId) {
        setFormHostelId(hList[0].id);
      }
      if (bList.length > 0 && !formBuildingId) {
        setFormBuildingId(bList[0].id);
      }
      if (fList.length > 0 && !formFloorId) {
        setFormFloorId(fList[0].id);
      }
    } catch (err: any) {
      console.error("loadRooms error:", err);
      setError(err.message || "Failed to load rooms.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedHostelFilter]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !roomNumber.trim()) return;

    const hostel = hostels.find((h) => h.id === formHostelId);
    const building = buildings.find((b) => b.id === formBuildingId);
    const floor = floors.find((f) => f.id === formFloorId);

    setIsSubmitting(true);
    try {
      await createHostelRoom(
        organization.id,
        {
          hostelId: formHostelId,
          hostelName: hostel?.name || "Hostel",
          buildingId: formBuildingId,
          buildingName: building?.name || "Building",
          floorId: formFloorId,
          floorName: floor?.name || "Floor",
          roomNumber: roomNumber.trim(),
          roomType,
          capacity: Number(capacity) || 1,
          status: "Active",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setRoomNumber("");
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to create room: " + err.message);
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
            Hostel Rooms & Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure room types, student capacities, and automated bed inventory.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Add Room"}
        </Button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateRoom}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">New Room Setup</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Hostel *</label>
              <select
                value={formHostelId}
                onChange={(e) => setFormHostelId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Building Block *</label>
              <select
                value={formBuildingId}
                onChange={(e) => setFormBuildingId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {buildings
                  .filter((b) => (formHostelId ? b.hostelId === formHostelId : true))
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Floor Level *</label>
              <select
                value={formFloorId}
                onChange={(e) => setFormFloorId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {floors
                  .filter((f) => (formBuildingId ? f.buildingId === formBuildingId : true))
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Room Number *</label>
              <input
                type="text"
                required
                value={roomNumber}
                onChange={(e) => setRoomNumber(e.target.value)}
                placeholder="e.g. 101, 204-B"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold font-mono text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Room Type *</label>
              <select
                value={roomType}
                onChange={(e) => {
                  setRoomType(e.target.value);
                  if (e.target.value === "Single") setCapacity(1);
                  if (e.target.value === "Double Occupancy") setCapacity(2);
                  if (e.target.value === "Triple Occupancy") setCapacity(3);
                  if (e.target.value === "Dormitory") setCapacity(6);
                }}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-bold"
              >
                <option value="Single">Single Room (1 Bed)</option>
                <option value="Double Occupancy">Double Occupancy (2 Beds)</option>
                <option value="Triple Occupancy">Triple Occupancy (3 Beds)</option>
                <option value="Dormitory">Dormitory (6 Beds)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Capacity (Beds) *</label>
              <input
                type="number"
                min={1}
                max={20}
                required
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value) || 1)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !roomNumber.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Generating..." : "Save Room & Beds"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setSelectedHostelFilter("")}
          className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
            !selectedHostelFilter
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All Hostels
        </button>
        {hostels.map((h) => (
          <button
            key={h.id}
            onClick={() => setSelectedHostelFilter(h.id)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedHostelFilter === h.id
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {h.name}
          </button>
        ))}
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : rooms.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Bed className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No rooms configured</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add rooms and their capacities to begin allocation.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Room No</th>
                  <th className="py-3 px-4">Hostel</th>
                  <th className="py-3 px-4">Building & Floor</th>
                  <th className="py-3 px-4">Room Type</th>
                  <th className="py-3 px-4">Capacity</th>
                  <th className="py-3 px-4">Occupancy</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {rooms.map((r) => (
                  <tr key={r.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {r.roomNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{r.hostelName}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {r.buildingName} • {r.floorName}
                    </td>
                    <td className="py-3 px-4 text-foreground">{r.roomType}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{r.capacity} Beds</td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-mono font-bold ${
                          (r.occupiedCount || 0) >= r.capacity
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {r.occupiedCount || 0} / {r.capacity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
