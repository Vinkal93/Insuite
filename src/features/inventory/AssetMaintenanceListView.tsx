import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Wrench,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  Eye,
  Boxes,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAssetMaintenance,
  createAssetMaintenance,
  completeAssetMaintenance,
  listAssets,
  listVendors,
} from "@/services/inventoryService";
import type {
  AssetMaintenanceRecord,
  InventoryAsset,
  InventoryVendor,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const AssetMaintenanceListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [maintenanceList, setMaintenanceList] = useState<AssetMaintenanceRecord[]>([]);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Schedule Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [issue, setIssue] = useState("");
  const [description, setDescription] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [scheduledDate, setScheduledDate] = useState(new Date().toISOString().split("T")[0]);
  const [estimatedCost, setEstimatedCost] = useState<number>(0);
  const [notes, setNotes] = useState("");
  const [isScheduling, setIsScheduling] = useState(false);

  // Complete Modal State
  const [completingRecord, setCompletingRecord] = useState<AssetMaintenanceRecord | null>(null);
  const [actualCost, setActualCost] = useState<number>(0);
  const [completedDate, setCompletedDate] = useState(new Date().toISOString().split("T")[0]);
  const [completionNotes, setCompletionNotes] = useState("");
  const [isCompleting, setIsCompleting] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [mList, aList, vList] = await Promise.all([
        listAssetMaintenance(organization.id),
        listAssets(organization.id),
        listVendors(organization.id),
      ]);
      setMaintenanceList(mList);
      setAssets(aList);
      setVendors(vList);
      if (aList.length > 0) setAssetId(aList[0].id);
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

  const handleScheduleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!assetId || !issue.trim()) {
      alert("Please select an asset and describe the maintenance issue.");
      return;
    }

    setIsScheduling(true);
    try {
      await createAssetMaintenance(
        organization.id,
        {
          assetId,
          issue: issue.trim(),
          description: description.trim() || null,
          vendorId: vendorId || null,
          scheduledDate,
          estimatedCost: Number(estimatedCost) || null,
          notes: notes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowScheduleModal(false);
      setIssue("");
      setDescription("");
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert("Failed to schedule maintenance: " + err.message);
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !completingRecord) return;

    setIsCompleting(true);
    try {
      await completeAssetMaintenance(
        organization.id,
        completingRecord.id,
        Number(actualCost) || 0,
        completedDate,
        completionNotes.trim() || null,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setCompletingRecord(null);
      setCompletionNotes("");
      await loadData();
    } catch (err: any) {
      alert("Failed to complete maintenance: " + err.message);
    } finally {
      setIsCompleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Asset Maintenance & Servicing
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Repair scheduling, calibration records, and actual equipment maintenance ledger.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => setShowScheduleModal(true)}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Schedule Maintenance
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
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
      ) : maintenanceList.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Wrench className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No maintenance records</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Schedule repairs, hardware upgrades, or periodic servicing for fixed assets.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScheduleModal(true)}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Schedule Maintenance
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Service Vendor</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Completed Date</th>
                <th className="py-3 px-4">Cost (₹)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {maintenanceList.map((m) => (
                <tr key={m.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">
                    {m.assetName} <span className="font-mono text-primary font-normal">({m.assetCode})</span>
                  </td>
                  <td className="py-3 px-4 text-foreground font-medium">{m.issue}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.vendorName || "In-House"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.scheduledDate}</td>
                  <td className="py-3 px-4 text-muted-foreground">{m.completedDate || "—"}</td>
                  <td className="py-3 px-4 font-mono font-bold text-foreground">
                    {m.actualCost ? `₹${m.actualCost.toLocaleString()}` : m.estimatedCost ? `Est: ₹${m.estimatedCost.toLocaleString()}` : "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        m.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : m.status === "Scheduled"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-blue-500/10 text-blue-600 border-blue-500/20"
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
                          setCompletingRecord(m);
                          setActualCost(m.estimatedCost || 0);
                        }}
                        className="h-7 px-2.5 text-xs font-bold"
                      >
                        <CheckCircle2 className="size-3.5 mr-1" /> Complete
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Schedule Asset Maintenance</h3>

            <form onSubmit={handleScheduleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Asset *
                </label>
                <select
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Issue Title *
                </label>
                <input
                  type="text"
                  required
                  value={issue}
                  onChange={(e) => setIssue(e.target.value)}
                  placeholder="e.g. Projector lamp replacement / Microscope lens calibration"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
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
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Service Contractor / Vendor
                </label>
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">In-House IT / Maintenance Staff</option>
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScheduleModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isScheduling}
                  className="rounded-xl text-xs font-bold"
                >
                  {isScheduling ? "Scheduling..." : "Schedule Repair"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Maintenance Modal */}
      {completingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Complete Maintenance: {completingRecord.assetName}
            </h3>

            <form onSubmit={handleCompleteSubmit} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Completion Date *
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
                    Actual Expense Cost (₹) *
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
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Service Notes / Replaced Parts
                </label>
                <textarea
                  rows={2}
                  value={completionNotes}
                  onChange={(e) => setCompletionNotes(e.target.value)}
                  placeholder="e.g. Lamp replaced with original OEM unit, calibrated display"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCompletingRecord(null)}
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
                  {isCompleting ? "Saving..." : "Confirm & Restore Asset"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
