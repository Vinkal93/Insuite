import React, { useState, useEffect } from "react";
import {
  MapPin,
  Plus,
  Edit2,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listStops,
  createStop,
  updateStop,
  deleteStop,
} from "@/services/transportService";
import type { TransportStop } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const StopsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [stops, setStops] = useState<TransportStop[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingStop, setEditingStop] = useState<TransportStop | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [defaultPickupTime, setDefaultPickupTime] = useState("07:15");
  const [defaultDropTime, setDefaultDropTime] = useState("14:45");
  const [status, setStatus] = useState<"Active" | "Inactive">("Active");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadStops = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listStops(organization.id);
      setStops(data);
    } catch (err: any) {
      console.error("loadStops error:", err);
      setError(err.message || "Failed to load stops.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStops();
  }, [organization]);

  const openCreateModal = () => {
    setEditingStop(null);
    setName("");
    setCode("");
    setAddress("");
    setDefaultPickupTime("07:15");
    setDefaultDropTime("14:45");
    setStatus("Active");
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (s: TransportStop) => {
    setEditingStop(s);
    setName(s.name);
    setCode(s.code || "");
    setAddress(s.address || "");
    setDefaultPickupTime(s.defaultPickupTime || "07:15");
    setDefaultDropTime(s.defaultDropTime || "14:45");
    setStatus(s.status);
    setModalError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!name.trim()) {
      setModalError("Stop name is required.");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingStop) {
        await updateStop(
          organization.id,
          editingStop.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase() || null,
            address: address.trim() || null,
            defaultPickupTime,
            defaultDropTime,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      } else {
        await createStop(
          organization.id,
          {
            name: name.trim(),
            code: code.trim().toUpperCase() || null,
            address: address.trim() || null,
            defaultPickupTime,
            defaultDropTime,
            status,
          },
          { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
        );
      }
      setShowModal(false);
      await loadStops();
    } catch (err: any) {
      setModalError(err.message || "Failed to save stop.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (stopId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to delete this stop?")) return;

    try {
      await deleteStop(organization.id, stopId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadStops();
    } catch (err: any) {
      alert("Failed to delete stop: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Designated Stops & Waypoints
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage student pickup/drop stops, landmark addresses, and default scheduled timings.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={openCreateModal}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add Stop
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
          <Button onClick={loadStops} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : stops.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <MapPin className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No stops defined yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Add designated neighborhood stops and road junctions for student transport.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={openCreateModal}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Add Stop
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stops.map((stop) => (
            <div
              key={stop.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{stop.name}</h3>
                  {stop.code && (
                    <span className="font-mono text-[10px] text-primary font-bold">
                      {stop.code}
                    </span>
                  )}
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    stop.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {stop.status}
                </span>
              </div>

              {stop.address && (
                <p className="text-xs text-muted-foreground line-clamp-2">{stop.address}</p>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-surface/50 p-2 rounded-xl border border-border">
                <div>
                  <span className="text-muted-foreground block">Pickup Time</span>
                  <span className="font-semibold text-foreground">
                    {stop.defaultPickupTime || "—"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Drop Time</span>
                  <span className="font-semibold text-foreground">
                    {stop.defaultDropTime || "—"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-1.5 border-t border-border pt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openEditModal(stop)}
                  className="h-7 px-2 text-xs"
                >
                  <Edit2 className="size-3.5 mr-1 text-muted-foreground" /> Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(stop.id)}
                  className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stop Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              {editingStop ? "Edit Designated Stop" : "Add Designated Stop"}
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
                  Stop Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Green Park Metro Gate 2"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Stop Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="e.g. STP-01"
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
                  Landmark / Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Main Ring Road, opposite City Bank"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Pickup Time
                  </label>
                  <input
                    type="time"
                    value={defaultPickupTime}
                    onChange={(e) => setDefaultPickupTime(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Default Drop Time
                  </label>
                  <input
                    type="time"
                    value={defaultDropTime}
                    onChange={(e) => setDefaultDropTime(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
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
                  {isSubmitting ? "Saving..." : "Save Stop"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
