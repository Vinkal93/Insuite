import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Boxes,
  ArrowLeft,
  UserCheck,
  ArrowLeftRight,
  Wrench,
  FileCheck,
  Clock,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAsset,
  listAssetAssignments,
  listAssetTransfers,
  listAssetMaintenance,
  uploadAssetDocument,
  deleteAssetDocument,
  assignAsset,
  returnAsset,
  transferAsset,
  updateAsset,
  listLocations,
} from "@/services/inventoryService";
import { listStaff } from "@/services/hrService";
import type {
  InventoryAsset,
  AssetAssignment,
  AssetTransfer,
  AssetMaintenanceRecord,
  InventoryLocation,
  AssetStatus,
} from "@/types/inventory";
import type { Staff } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const AssetDetailView: React.FC = () => {
  const { assetId } = useParams({ from: "/inventory/assets/$assetId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [asset, setAsset] = useState<InventoryAsset | null>(null);
  const [assignments, setAssignments] = useState<AssetAssignment[]>([]);
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [maintenance, setMaintenance] = useState<AssetMaintenanceRecord[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);

  const [activeTab, setActiveTab] = useState<"overview" | "assignments" | "transfers" | "maintenance" | "documents">(
    "overview"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Assign Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignStaffId, setAssignStaffId] = useState("");
  const [assignEffectiveDate, setAssignEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [assignNotes, setAssignNotes] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  // Transfer Modal
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferLocationId, setTransferLocationId] = useState("");
  const [transferStaffId, setTransferStaffId] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  // Upload Doc Modal
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState<"Invoice" | "Warranty" | "Purchase Document" | "Service Document" | "Other">("Invoice");
  const [docNumber, setDocNumber] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    if (!organization || !assetId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ast, asgnList, trList, mList, sList, locList] = await Promise.all([
        getAsset(organization.id, assetId),
        listAssetAssignments(organization.id, assetId),
        listAssetTransfers(organization.id, assetId),
        listAssetMaintenance(organization.id, assetId),
        listStaff(organization.id, { status: "Active" }),
        listLocations(organization.id),
      ]);
      setAsset(ast);
      setAssignments(asgnList);
      setTransfers(trList);
      setMaintenance(mList);
      setStaffList(sList);
      setLocations(locList);
      if (sList.length > 0) setAssignStaffId(sList[0].id);
      if (locList.length > 0) setTransferLocationId(locList[0].id);
    } catch (err: any) {
      console.error("Asset detail load error:", err);
      setError(err.message || "Failed to load asset details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, assetId]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !assetId) return;
    if (!assignStaffId) {
      alert("Please select a custodian staff member.");
      return;
    }

    setIsAssigning(true);
    try {
      await assignAsset(
        organization.id,
        {
          assetId,
          assignmentType: "Staff",
          staffId: assignStaffId,
          effectiveDate: assignEffectiveDate,
          notes: assignNotes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowAssignModal(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to assign asset: " + err.message);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleReturnAsset = async (assignmentId: string) => {
    if (!organization || !firebaseUser) return;
    const notes = prompt("Enter any return inspection remarks (optional):");
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

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !assetId) return;
    if (!transferReason.trim()) {
      alert("Please provide a reason for the transfer.");
      return;
    }

    setIsTransferring(true);
    try {
      await transferAsset(
        organization.id,
        {
          assetId,
          toLocationId: transferLocationId || null,
          toStaffId: transferStaffId || null,
          transferDate: new Date().toISOString().split("T")[0],
          reason: transferReason.trim(),
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowTransferModal(false);
      setTransferReason("");
      await loadData();
    } catch (err: any) {
      alert("Failed to transfer asset: " + err.message);
    } finally {
      setIsTransferring(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !assetId || !selectedFile) {
      alert("Please select a file to upload.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadAssetDocument(
        organization.id,
        assetId,
        docType,
        docNumber,
        docExpiry,
        selectedFile,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowDocModal(false);
      setDocNumber("");
      setDocExpiry("");
      setSelectedFile(null);
      await loadData();
    } catch (err: any) {
      alert("Failed to upload document: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!organization || !firebaseUser || !assetId) return;
    if (!confirm("Are you sure you want to remove this document attachment?")) return;

    try {
      await deleteAssetDocument(organization.id, assetId, docId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  const handleStatusChange = async (newStatus: AssetStatus) => {
    if (!organization || !firebaseUser || !assetId) return;
    if (!confirm(`Are you sure you want to update this asset's status to "${newStatus}"?`)) return;

    try {
      await updateAsset(
        organization.id,
        assetId,
        { status: newStatus },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      await loadData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !asset) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Asset Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The fixed asset record does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/inventory/assets">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Assets
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <Boxes className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{asset.name}</h1>
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {asset.assetCode}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    asset.status === "Available"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : asset.status === "Assigned"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : asset.status === "Maintenance"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {asset.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Category: {asset.categoryName} • Serial:{" "}
                <span className="font-mono font-semibold text-foreground">
                  {asset.serialNumber || "N/A"}
                </span>{" "}
                • Condition: {asset.condition}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {asset.status === "Available" && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowAssignModal(true)}
                className="rounded-xl text-xs font-bold h-8 shadow-soft"
              >
                <UserCheck className="size-3.5 mr-1" /> Assign Custodian
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransferModal(true)}
              className="rounded-xl text-xs h-8"
            >
              <ArrowLeftRight className="size-3.5 mr-1" /> Transfer
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/inventory/maintenance">
                <Wrench className="size-3.5 mr-1" /> Maintenance
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Current Custodian
            </span>
            <p className="text-xs font-bold text-foreground mt-1">
              {asset.assignedToStaffName || "Unassigned / In Pool"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Location</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {asset.locationName || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Purchase Cost
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">
              {asset.purchasePrice ? `₹${asset.purchasePrice.toLocaleString()}` : "—"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Warranty Expiry
            </span>
            <p className="text-xs font-bold text-foreground mt-1">
              {asset.warrantyExpiry || "Not Recorded"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 text-xs">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "overview"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("assignments")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "assignments"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Custodian History ({assignments.length})
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "transfers"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Transfers ({transfers.length})
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "maintenance"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Maintenance Logs ({maintenance.length})
          </button>
          <button
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "documents"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Invoices & Warranties ({(asset.documents || []).length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Hardware & Asset Profile
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[10px] text-muted-foreground">Manufacturer / Brand</dt>
                <dd className="font-semibold text-foreground">{asset.manufacturer || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Model Number</dt>
                <dd className="font-semibold text-foreground">{asset.model || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Serial Number</dt>
                <dd className="font-mono font-semibold text-primary">
                  {asset.serialNumber || "—"}
                </dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Current Condition</dt>
                <dd className="font-semibold text-foreground">{asset.condition}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Lifecycle State Operations
            </h2>
            <p className="text-xs text-muted-foreground">
              Update physical state if damaged, lost, or decommissioning from inventory.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("Damaged")}
                className="rounded-xl text-xs h-8 text-rose-500 border-rose-500/20 hover:bg-rose-500/10"
              >
                Mark Damaged
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("Lost")}
                className="rounded-xl text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
              >
                Mark Lost
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange("Retired")}
                className="rounded-xl text-xs h-8 text-muted-foreground"
              >
                Retire / Scrap
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Custodian History */}
      {activeTab === "assignments" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Custodian Assignment Log</h2>
              <p className="text-xs text-muted-foreground">Faculty members and departments assigned to this asset</p>
            </div>
            {asset.status === "Available" && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowAssignModal(true)}
                className="rounded-xl text-xs font-bold h-8"
              >
                <UserCheck className="size-3.5 mr-1" /> Assign Asset
              </Button>
            )}
          </div>

          {assignments.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No historical assignments for this asset.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Custodian Staff</th>
                    <th className="py-2.5 px-4">Effective Date</th>
                    <th className="py-2.5 px-4">Return Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {assignments.map((asgn) => (
                    <tr key={asgn.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-bold text-foreground">
                        {asgn.staffName || "Unassigned"}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">
                        {asgn.effectiveDate}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-muted-foreground">
                        {asgn.returnDate || "In Use"}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                            asgn.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {asgn.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {asgn.status === "Active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReturnAsset(asgn.id)}
                            className="h-6 px-2 text-xs"
                          >
                            Return Asset
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Transfers */}
      {activeTab === "transfers" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Location & Custodian Transfers</h2>
              <p className="text-xs text-muted-foreground">Recorded handovers between rooms and staff</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTransferModal(true)}
              className="rounded-xl text-xs h-8"
            >
              <ArrowLeftRight className="size-3.5 mr-1" /> Transfer Asset
            </Button>
          </div>

          {transfers.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No transfers recorded for this asset.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">From Location</th>
                    <th className="py-2.5 px-4">To Location</th>
                    <th className="py-2.5 px-4">Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transfers.map((tr) => (
                    <tr key={tr.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 text-muted-foreground">{tr.transferDate}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {tr.fromLocationName || "—"}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">
                        {tr.toLocationName || "—"}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">{tr.reason}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 4: Maintenance */}
      {activeTab === "maintenance" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Maintenance & Repair Logs</h2>
              <p className="text-xs text-muted-foreground">Servicing history and actual part repair expenses</p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/inventory/maintenance">Schedule Maintenance →</Link>
            </Button>
          </div>

          {maintenance.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No maintenance records logged for this asset.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Issue</th>
                    <th className="py-2.5 px-4">Scheduled Date</th>
                    <th className="py-2.5 px-4">Cost (₹)</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {maintenance.map((m) => (
                    <tr key={m.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-bold text-foreground">{m.issue}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{m.scheduledDate}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                        {m.actualCost ? `₹${m.actualCost}` : m.estimatedCost ? `Est: ₹${m.estimatedCost}` : "—"}
                      </td>
                      <td className="py-2.5 px-4 font-semibold">{m.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 5: Documents */}
      {activeTab === "documents" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Invoices, Warranties & Certificates</h2>
              <p className="text-xs text-muted-foreground">Attached purchase orders, vendor invoices, and warranty cards</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(true)}
              className="rounded-xl text-xs h-8"
            >
              <Upload className="size-3.5 mr-1" /> Upload Document
            </Button>
          </div>

          {(asset.documents || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No documents attached to this asset.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4">File Name</th>
                    <th className="py-2.5 px-4">Uploaded</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {asset.documents.map((doc) => (
                    <tr key={doc.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-bold text-foreground">{doc.type}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{doc.fileName}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {doc.uploadedAt.split("T")[0]}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="h-6 px-2 text-xs text-primary"
                          >
                            <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                              <Download className="size-3 mr-1" /> View
                            </a>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteDoc(doc.id)}
                            className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Assign Asset: {asset.name}
            </h3>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Custodian Staff Member *
                </label>
                <select
                  value={assignStaffId}
                  onChange={(e) => setAssignStaffId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.employeeId} - {s.professional.departmentName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={assignEffectiveDate}
                  onChange={(e) => setAssignEffectiveDate(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Assignment Notes
                </label>
                <textarea
                  rows={2}
                  value={assignNotes}
                  onChange={(e) => setAssignNotes(e.target.value)}
                  placeholder="e.g. Issued for classroom projection & lecture use"
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
                  {isAssigning ? "Assigning..." : "Confirm Assignment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Transfer Asset: {asset.name}
            </h3>

            <form onSubmit={handleTransferSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Target Destination Location
                </label>
                <select
                  value={transferLocationId}
                  onChange={(e) => setTransferLocationId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Keep Current Location</option>
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Transfer Custodian (Optional)
                </label>
                <select
                  value={transferStaffId}
                  onChange={(e) => setTransferStaffId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="">Keep Current Custodian</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Reason for Transfer *
                </label>
                <textarea
                  rows={2}
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g. Relocated to Physics Laboratory 2 for annual practicals"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isTransferring}
                  className="rounded-xl text-xs font-bold"
                >
                  {isTransferring ? "Transferring..." : "Confirm Transfer"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Attach Asset Document</h3>

            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Document Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Invoice">Purchase Invoice</option>
                  <option value="Warranty">Warranty Certificate</option>
                  <option value="Purchase Document">Purchase Order Receipt</option>
                  <option value="Service Document">Maintenance / Calibration Report</option>
                  <option value="Other">Other Document</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Document / Invoice Number
                </label>
                <input
                  type="text"
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. INV-2024-8891"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select File *
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-secondary file:text-foreground hover:file:bg-muted cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowDocModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isUploading}
                  className="rounded-xl text-xs font-bold"
                >
                  {isUploading ? "Uploading..." : "Save Document"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
