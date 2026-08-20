import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  UserCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Boxes,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listAssetAssignments,
  returnAsset,
  listAssets,
  assignAsset,
} from "@/services/inventoryService";
import { listStaff } from "@/services/hrService";
import type { AssetAssignment, InventoryAsset } from "@/types/inventory";
import type { Staff } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const AssetAssignmentsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [availableAssets, setAvailableAssets] = useState<InventoryAsset[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [asgns, asts, sList] = await Promise.all([
        listAssetAssignments(organization.id),
        listAssets(organization.id, { status: "Available" }),
        listStaff(organization.id, { status: "Active" }),
      ]);
      setAssignments(asgns);
      setAvailableAssets(asts);
      setStaffList(sList);
      if (asts.length > 0) setSelectedAssetId(asts[0].id);
      if (sList.length > 0) setSelectedStaffId(sList[0].id);
    } catch (err: any) {
      console.error("loadAssignments error:", err);
      setError(err.message || "Failed to load asset assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleReturn = async (assignmentId: string) => {
    if (!organization || !firebaseUser) return;
    const notes = prompt("Enter return inspection notes (optional):");
    const returnDate = new Date().toISOString().split("T")[0];

    try {
      await returnAsset(organization.id, assignmentId, returnDate, notes || null, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to return asset: " + err.message);
    }
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!selectedAssetId || !selectedStaffId) {
      alert("Please select both an available asset and a staff custodian.");
      return;
    }

    setIsAssigning(true);
    try {
      await assignAsset(
        organization.id,
        {
          assetId: selectedAssetId,
          assignmentType: "Staff",
          staffId: selectedStaffId,
          effectiveDate,
          notes: notes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowAssignModal(false);
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert("Failed to assign asset: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Asset Custodian Assignments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active and returned physical custody records linked directly to Staff & HR profiles.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => setShowAssignModal(true)}
          disabled={availableAssets.length === 0}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Assign Asset
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
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <UserCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No asset assignments recorded</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign laptops, classroom projectors, or laboratory equipment to faculty.
          </p>
          {availableAssets.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAssignModal(true)}
              className="mt-4 rounded-xl text-xs"
            >
              <Plus className="size-3.5 mr-1" /> Assign Asset
            </Button>
          )}
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">Custodian Faculty</th>
                <th className="py-3 px-4">Effective Date</th>
                <th className="py-3 px-4">Return Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {assignments.map((asgn) => (
                <tr key={asgn.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">
                    {asgn.assetName} <span className="font-mono text-primary font-normal">({asgn.assetCode})</span>
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {asgn.staffName || "Unassigned"}
                  </td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{asgn.effectiveDate}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {asgn.returnDate || <span className="text-emerald-600 font-bold">Active Custody</span>}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        asgn.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {asgn.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/inventory/assets/$assetId" params={{ assetId: asgn.assetId }}>
                          <Eye className="size-3.5 mr-1" /> Dossier
                        </Link>
                      </Button>
                      {asgn.status === "Active" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleReturn(asgn.id)}
                          className="h-7 px-2.5 text-xs font-semibold"
                        >
                          Return Asset
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Assign Fixed Asset</h3>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Available Asset *
                </label>
                <select
                  value={selectedAssetId}
                  onChange={(e) => setSelectedAssetId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} ({a.assetCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Custodian Staff Member *
                </label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Effective Handover Date *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Assignment Notes
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Issued for classroom lectures and practical demonstrations"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAssignModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isAssigning}
                  className="rounded-xl text-xs font-bold"
                >
                  {isAssigning ? "Assigning..." : "Confirm Custody"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
