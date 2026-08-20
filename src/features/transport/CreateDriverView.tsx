import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  UserCheck,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createDriver,
  listVehicles,
} from "@/services/transportService";
import { listStaff } from "@/services/hrService";
import type { Staff } from "@/types/hr";
import type { TransportVehicle } from "@/types/transport";
import type { TransportDriverInput } from "@/schemas/transport";
import { Button } from "@/components/ui/button";

export const CreateDriverView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form Fields
  const [staffId, setStaffId] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseType, setLicenseType] = useState("Commercial Heavy Vehicle");
  const [licenseExpiry, setLicenseExpiry] = useState("");
  const [experienceYears, setExperienceYears] = useState<number>(5);
  const [medicalExpiry, setMedicalExpiry] = useState("");
  const [assignedVehicleId, setAssignedVehicleId] = useState("");
  const [status, setStatus] = useState<"Active" | "Inactive" | "Suspended">("Active");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [sList, vList] = await Promise.all([
          listStaff(organization.id, { status: "Active" }),
          listVehicles(organization.id, { status: "Active" }),
        ]);
        setStaffList(sList);
        setVehicles(vList);
        if (sList.length > 0) setStaffId(sList[0].id);
      } catch (err: any) {
        console.error("Init create driver error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!staffId) {
      setError("Please select an existing staff member.");
      return;
    }
    if (!licenseNumber.trim() || !licenseExpiry) {
      setError("License number and expiry date are required.");
      return;
    }

    const input: TransportDriverInput = {
      staffId,
      licenseNumber: licenseNumber.trim().toUpperCase(),
      licenseType,
      licenseExpiry,
      experienceYears: experienceYears ? Number(experienceYears) : null,
      medicalExpiry: medicalExpiry || null,
      assignedVehicleId: assignedVehicleId || null,
      status,
    };

    setIsSubmitting(true);
    try {
      const created = await createDriver(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      navigate({ to: "/transport/drivers/$driverId", params: { driverId: created.id } });
    } catch (err: any) {
      console.error("Create driver error:", err);
      setError(err.message || "Failed to onboard driver.");
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/transport/drivers">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Onboard Transport Driver
            </h1>
            <p className="text-xs text-muted-foreground">
              Link existing staff member to driver certification and vehicle assignments.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Staff Linking */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Section A: Staff Member Linking
          </h2>
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Staff Member *
            </label>
            {staffList.length === 0 ? (
              <p className="text-xs text-destructive">
                No active staff members found. Please register staff in the Staff & HR module first.
              </p>
            ) : (
              <select
                value={staffId}
                onChange={(e) => setStaffId(e.target.value)}
                required
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} — {s.employeeId} ({s.professional.designationName} •{" "}
                    {s.professional.departmentName})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* License & Credentials */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Section B: Commercial Driving Credentials
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Commercial License No. *
              </label>
              <input
                type="text"
                required
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder="e.g. DL-0420190012345"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                License Category
              </label>
              <input
                type="text"
                value={licenseType}
                onChange={(e) => setLicenseType(e.target.value)}
                placeholder="e.g. Commercial Heavy Vehicle (HMV)"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                License Expiry Date *
              </label>
              <input
                type="date"
                required
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Experience (Years)
              </label>
              <input
                type="number"
                min={0}
                max={50}
                value={experienceYears}
                onChange={(e) => setExperienceYears(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Medical Certificate Expiry
              </label>
              <input
                type="date"
                value={medicalExpiry}
                onChange={(e) => setMedicalExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Assigned Primary Vehicle
              </label>
              <select
                value={assignedVehicleId}
                onChange={(e) => setAssignedVehicleId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None (Assign Later)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/transport/drivers">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Onboarding..." : "Onboard Driver"}
          </Button>
        </div>
      </form>
    </div>
  );
};
