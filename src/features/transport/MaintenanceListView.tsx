import React, { useState, useEffect, useMemo } from "react";
import {
  Wrench,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Check,
  Calendar,
  Bus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listMaintenanceRecords,
  createMaintenanceRecord,
  completeMaintenanceRecord,
  listVehicles,
} from "@/services/transportService";
import type {
  TransportMaintenance,
  TransportVehicle,
  MaintenanceType,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const MaintenanceListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [records, setRecords] = useState<TransportMaintenance[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [vehicleId, setVehicleId] = useState("");
  const [mType, setMType] = useState<MaintenanceType>("Service");
  const [description, setDescription] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [vendor, setVendor] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Complete Modal
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<TransportMaintenance | null>(null);
  const [actualCost, setActualCost] = useState<number>(0);
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split("T")[0]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [mList, vList] = await Promise.all([
        listMaintenanceRecords(organization.id),
        listVehicles(organization.id),
      ]);
      setRecords(mList);
      setVehicles(vList);
      if (vList.length > 0) setVehicleId(vList[0].id);
    } catch (err: any) {
      console.error("loadMaintenance error:", err);
      setError(err.message || "Failed to load maintenance records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setCreateError(null);

    if (!vehicleId || !description.trim() || !scheduledDate) {
      setCreateError("Vehicle, description, and scheduled date are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createMaintenanceRecord(
        organization.id,
        {
          vehicleId,
          type: mType,
          description: description.trim(),
          scheduledDate,
          estimatedCost: estimatedCost ? Number(estimatedCost) : null,
          vendor: vendor.trim() || null,
          notes: notes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowCreateModal(false);
      setDescription("");
      setVendor("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      setCreateError(err.message || "Failed to schedule maintenance.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedRecord) return;

    setIsCompleting(true);
    try {
      await completeMaintenanceRecord(
        organization.id,
        selectedRecord.id,
        Number(actualCost),
        completedDate,
        completionNotes.trim() || null,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowCompleteModal(false);
      setSelectedRecord(null);
      await loadData();
    } catch (err: any) {
      alert("Failed to complete record: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  const filtered = useMemo(() => {
    return records.filter((r) => {
      return typeFilter === "ALL" || r.type === typeFilter;
    });
  }, [records, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Fleet Maintenance & Service Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log periodic oil changes, brake servicing, tyre replacements, and overhaul repairs.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => {
            setCreateError(null);
            setShowCreateModal(true);
          }}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Schedule Service
        </Button>
      </div>

      {/* Filter */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-sm">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="w-full rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="ALL">All Maintenance Types</option>
          <option value="Service">Routine Service</option>
          <option value="Repair">Breakdown Repair</option>
          <option value="Inspection">Roadworthiness Inspection</option>
          <option value="Tyre">Tyre Rotation / Replacement</option>
          <option value="Battery">Battery Replacement</option>
          <option value="Other">Other</option>
        </select>
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
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Wrench className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No maintenance records logged</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Keep track of vehicle repairs, part costs, and servicing logs.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Schedule Service
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Vendor / Workshop</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{m.vehicleNumber}</td>
                  <td className="py-3 px-4 font-semibold text-primary">{m.type}</td>
                  <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                    {m.description}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{m.scheduledDate}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.vendor || "—"}</td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {m.actualCost !== undefined && m.actualCost !== null
                      ? `₹${m.actualCost}`
                      : m.estimatedCost
                      ? `Est: ₹${m.estimatedCost}`
                      : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        m.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : m.status === "In Progress"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {m.status !== "Completed" && (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => {
                          setSelectedRecord(m);
                          setActualCost(m.estimatedCost || 0);
                          setShowCompleteModal(true);
                        }}
                        className="h-7 px-2 text-xs font-bold"
                      >
                        <Check className="size-3 mr-1" /> Mark Done
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Service Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-foreground">Schedule Vehicle Service</h3>

            {createError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Select Vehicle *
                  </label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.registrationNumber})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Service Type *
                  </label>
                  <select
                    value={mType}
                    onChange={(e) => setMType(e.target.value as any)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Service">Routine Periodic Service</option>
                    <option value="Repair">Breakdown Repair</option>
                    <option value="Inspection">Roadworthiness Inspection</option>
                    <option value="Tyre">Tyre Alignment / Replacement</option>
                    <option value="Battery">Battery Service / Change</option>
                    <option value="Other">Other Maintenance</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description of Issue / Work *
                </label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="e.g. Engine oil and oil filter replacement, brake pads check"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Scheduled Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Estimated Cost (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(Number(e.target.value))}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Vendor / Garage
                  </label>
                  <input
                    type="text"
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="e.g. Authorized Service Center"
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCreateModal(false)}
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
                  {isSubmitting ? "Scheduling..." : "Save Maintenance Record"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Service Modal */}
      {showCompleteModal && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Complete Maintenance: {selectedRecord.vehicleNumber}
            </h3>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Actual Total Incurred Cost (₹) *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Date of Completion *
                </label>
                <input
                  type="date"
                  required
                  value={completedDate}
                  onChange={(e) => setCompletedDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Completion Notes / Invoice No.
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Invoice #SVC-2024-91, all parts verified"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleteModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isCompleting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isCompleting ? "Saving..." : "Confirm Completion"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
