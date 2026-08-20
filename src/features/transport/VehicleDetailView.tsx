import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Bus,
  ArrowLeft,
  Edit2,
  FileCheck,
  Wrench,
  Clock,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getVehicle,
  listMaintenanceRecords,
  listTrips,
  uploadVehicleDocument,
  deleteVehicleDocument,
  calculateDocumentStatus,
  getTransportSettings,
} from "@/services/transportService";
import type {
  TransportVehicle,
  TransportMaintenance,
  TransportTrip,
  TransportVehicleDocument,
  TransportSettingsConfig,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const VehicleDetailView: React.FC = () => {
  const { vehicleId } = useParams({ from: "/transport/vehicles/$vehicleId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [vehicle, setVehicle] = useState<TransportVehicle | null>(null);
  const [maintenance, setMaintenance] = useState<TransportMaintenance[]>([]);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "maintenance" | "trips">(
    "overview"
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload Doc Modal State
  const [showDocModal, setShowDocModal] = useState(false);
  const [docType, setDocType] = useState<TransportVehicleDocument["type"]>("Insurance");
  const [docNumber, setDocNumber] = useState("");
  const [docExpiry, setDocExpiry] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const loadData = async () => {
    if (!organization || !vehicleId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [v, mList, tList, conf] = await Promise.all([
        getVehicle(organization.id, vehicleId),
        listMaintenanceRecords(organization.id, vehicleId),
        listTrips(organization.id),
        getTransportSettings(organization.id),
      ]);
      setVehicle(v);
      setMaintenance(mList);
      setTrips(tList.filter((t) => t.vehicleId === vehicleId));
      setSettings(conf);
    } catch (err: any) {
      console.error("Vehicle detail load error:", err);
      setError(err.message || "Failed to load vehicle profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, vehicleId]);

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !vehicleId) return;
    if (!docNumber.trim() || !docExpiry) {
      alert("Document number and expiry date are required.");
      return;
    }

    setIsUploading(true);
    try {
      await uploadVehicleDocument(
        organization.id,
        vehicleId,
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
    if (!organization || !firebaseUser || !vehicleId) return;
    if (!confirm("Are you sure you want to remove this document certificate?")) return;

    try {
      await deleteVehicleDocument(organization.id, vehicleId, docId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to delete document: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !vehicle) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Vehicle Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The vehicle record does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/transport/vehicles">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Fleet
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
              <Bus className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{vehicle.vehicleNumber}</h1>
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {vehicle.registrationNumber}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    vehicle.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : vehicle.status === "Maintenance"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {vehicle.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {vehicle.type} • {vehicle.manufacturer || "Commercial"} {vehicle.model || ""} (
                {vehicle.fuelType})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/transport/vehicles/$vehicleId/edit" params={{ vehicleId: vehicle.id }}>
                <Edit2 className="size-3.5 mr-1" /> Edit Vehicle
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Capacity</span>
            <p className="text-lg font-black text-foreground mt-0.5">{vehicle.capacity} Passenger Seats</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Route</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {vehicle.assignedRouteName || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Primary Driver</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {vehicle.assignedDriverName || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Ownership</span>
            <p className="text-xs font-bold text-foreground mt-1">{vehicle.ownershipType}</p>
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
            onClick={() => setActiveTab("documents")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "documents"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Compliance & Documents ({(vehicle.documents || []).length})
          </button>
          <button
            onClick={() => setActiveTab("maintenance")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "maintenance"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Maintenance Log ({maintenance.length})
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "trips"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Scheduled Runs ({trips.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Vehicle Profile
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[10px] text-muted-foreground">Manufacturer</dt>
                <dd className="font-semibold text-foreground">{vehicle.manufacturer || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Model / Series</dt>
                <dd className="font-semibold text-foreground">{vehicle.model || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Year of Manufacture</dt>
                <dd className="font-semibold text-foreground">{vehicle.year || "—"}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Fuel Type</dt>
                <dd className="font-semibold text-foreground">{vehicle.fuelType}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Compliance Overview
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Insurance Validity</span>
                <span className="font-bold text-foreground">
                  {vehicle.insuranceExpiry || "Not Recorded"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Fitness Certificate</span>
                <span className="font-bold text-foreground">
                  {vehicle.fitnessExpiry || "Not Recorded"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Commercial Permit</span>
                <span className="font-bold text-foreground">
                  {vehicle.permitExpiry || "Not Recorded"}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Pollution Control (PUC)</span>
                <span className="font-bold text-foreground">
                  {vehicle.pollutionExpiry || "Not Recorded"}
                </span>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Tab 2: Compliance & Documents */}
      {activeTab === "documents" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">
                Compliance & Roadworthiness Certificates
              </h2>
              <p className="text-xs text-muted-foreground">
                Upload and audit insurance, fitness, permit, and pollution documents
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDocModal(true)}
              className="rounded-xl text-xs h-8 font-semibold"
            >
              <Upload className="size-3.5 mr-1" /> Upload Certificate
            </Button>
          </div>

          {(vehicle.documents || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No documents uploaded for this vehicle.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Certificate Type</th>
                    <th className="py-2.5 px-4">Document No.</th>
                    <th className="py-2.5 px-4">Expiry Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vehicle.documents.map((doc) => {
                    const st = calculateDocumentStatus(
                      doc.expiryDate,
                      settings?.docExpiryWarningDays
                    );
                    return (
                      <tr key={doc.id} className="hover:bg-surface/50">
                        <td className="py-2.5 px-4 font-bold text-foreground">{doc.type}</td>
                        <td className="py-2.5 px-4 font-mono text-muted-foreground">
                          {doc.documentNumber}
                        </td>
                        <td className="py-2.5 px-4">{doc.expiryDate}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              st === "Valid"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : st === "Expiring Soon"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-destructive/10 text-destructive border-destructive/20"
                            }`}
                          >
                            {st}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {doc.fileUrl && (
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
                            )}
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
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Maintenance */}
      {activeTab === "maintenance" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Maintenance & Service Log</h2>
              <p className="text-xs text-muted-foreground">Recorded servicing, repairs, and part replacements</p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/transport/maintenance">Manage Maintenance →</Link>
            </Button>
          </div>

          {maintenance.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No maintenance records logged for this vehicle.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Service Type</th>
                    <th className="py-2.5 px-4">Description</th>
                    <th className="py-2.5 px-4">Date</th>
                    <th className="py-2.5 px-4">Cost (₹)</th>
                    <th className="py-2.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {maintenance.map((m) => (
                    <tr key={m.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-bold text-foreground">{m.type}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{m.description}</td>
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

      {/* Tab 4: Trips */}
      {activeTab === "trips" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Assigned Run History
          </h2>
          {trips.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No trips logged for this vehicle.
            </p>
          ) : (
            <div className="space-y-3">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.routeName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Date: {t.date} • Driver: {t.driverName} ({t.tripType})
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Upload Doc Modal */}
      {showDocModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Upload Compliance Document</h3>
            <p className="text-xs text-muted-foreground">
              Record certificate metadata and attach PDF / Image file.
            </p>

            <form onSubmit={handleUploadDoc} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Certificate Type *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Insurance">Insurance Policy</option>
                  <option value="Fitness">Fitness Certificate</option>
                  <option value="Permit">Commercial Permit</option>
                  <option value="Pollution">Pollution (PUC) Certificate</option>
                  <option value="Registration">Registration Certificate (RC)</option>
                  <option value="Other">Other Certificate</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Document / Policy Number *
                </label>
                <input
                  type="text"
                  required
                  value={docNumber}
                  onChange={(e) => setDocNumber(e.target.value)}
                  placeholder="e.g. POL-91827364"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Expiry Date *
                </label>
                <input
                  type="date"
                  required
                  value={docExpiry}
                  onChange={(e) => setDocExpiry(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Attach File (Optional)
                </label>
                <input
                  type="file"
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
                  {isUploading ? "Uploading..." : "Save Certificate"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
