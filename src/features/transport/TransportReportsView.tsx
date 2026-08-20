import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Bus,
  Users,
  Wrench,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listVehicles,
  listStudentAssignments,
  listMaintenanceRecords,
  calculateDocumentStatus,
  getTransportSettings,
} from "@/services/transportService";
import type {
  TransportVehicle,
  StudentTransportAssignment,
  TransportMaintenance,
  TransportSettingsConfig,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const TransportReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [maintenance, setMaintenance] = useState<TransportMaintenance[]>([]);
  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [vList, aList, mList, conf] = await Promise.all([
        listVehicles(organization.id),
        listStudentAssignments(organization.id),
        listMaintenanceRecords(organization.id),
        getTransportSettings(organization.id),
      ]);
      setVehicles(vList);
      setAssignments(aList);
      setMaintenance(mList);
      setSettings(conf);
    } catch (err: any) {
      console.error("Transport reports error:", err);
      setError(err.message || "Failed to load reporting data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const downloadCSV = (filename: string, rows: string[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      rows.map((row) => row.map((val) => `"${val.replace(/"/g, '""')}"`).join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportVehicleRoster = () => {
    const headers = [
      "Vehicle Number",
      "Registration Number",
      "Type",
      "Capacity",
      "Fuel Type",
      "Ownership",
      "Insurance Expiry",
      "Fitness Expiry",
      "Status",
    ];
    const data = vehicles.map((v) => [
      v.vehicleNumber,
      v.registrationNumber,
      v.type,
      String(v.capacity),
      v.fuelType,
      v.ownershipType,
      v.insuranceExpiry || "N/A",
      v.fitnessExpiry || "N/A",
      v.status,
    ]);
    downloadCSV(`Fleet_Vehicle_Roster_${new Date().toISOString().split("T")[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  const exportStudentManifest = () => {
    const headers = [
      "Student Name",
      "Admission Number",
      "Class",
      "Section",
      "Route Name",
      "Route Code",
      "Designated Stop",
      "Pickup Time",
      "Drop Time",
      "Transit Option",
      "Status",
    ];
    const data = assignments.map((a) => [
      a.studentName,
      a.admissionNumber,
      a.className,
      a.sectionName,
      a.routeName,
      a.routeCode,
      a.stopName,
      a.pickupTime,
      a.dropTime,
      a.pickupDrop,
      a.status,
    ]);
    downloadCSV(`Student_Transport_Manifest_${new Date().toISOString().split("T")[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  const exportMaintenanceLedger = () => {
    const headers = [
      "Vehicle Number",
      "Service Type",
      "Description",
      "Scheduled Date",
      "Completed Date",
      "Estimated Cost",
      "Actual Cost",
      "Vendor",
      "Status",
    ];
    const data = maintenance.map((m) => [
      m.vehicleNumber,
      m.type,
      m.description,
      m.scheduledDate,
      m.completedDate || "N/A",
      String(m.estimatedCost || 0),
      String(m.actualCost || 0),
      m.vendor || "N/A",
      m.status,
    ]);
    downloadCSV(`Maintenance_Expense_Ledger_${new Date().toISOString().split("T")[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  const exportComplianceReport = () => {
    const headers = [
      "Vehicle Number",
      "Registration",
      "Insurance Expiry",
      "Insurance Status",
      "Fitness Expiry",
      "Fitness Status",
      "Permit Expiry",
      "Permit Status",
    ];
    const data = vehicles.map((v) => [
      v.vehicleNumber,
      v.registrationNumber,
      v.insuranceExpiry || "N/A",
      calculateDocumentStatus(v.insuranceExpiry, settings?.docExpiryWarningDays),
      v.fitnessExpiry || "N/A",
      calculateDocumentStatus(v.fitnessExpiry, settings?.docExpiryWarningDays),
      v.permitExpiry || "N/A",
      calculateDocumentStatus(v.permitExpiry, settings?.docExpiryWarningDays),
    ]);
    downloadCSV(`Fleet_Compliance_Audit_${new Date().toISOString().split("T")[0]}.csv`, [
      headers,
      ...data,
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Transport & Fleet Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Export production CSV rosters, student manifests, maintenance expenditure, and compliance audits.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-36 rounded-3xl bg-card border border-border animate-pulse" />
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
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Report 1 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Bus className="size-5" />
              </div>
              <h3 className="text-sm font-extrabold text-foreground">Fleet Vehicle Roster</h3>
              <p className="text-xs text-muted-foreground">
                Complete list of all registered buses, vans, passenger seating limits, and ownership models.
              </p>
              <p className="text-[11px] font-bold text-primary">
                {vehicles.length} Vehicles In Database
              </p>
            </div>
            <Button
              onClick={exportVehicleRoster}
              disabled={vehicles.length === 0}
              variant="hero"
              size="sm"
              className="rounded-xl text-xs font-bold shadow-soft w-full"
            >
              <Download className="size-3.5 mr-1.5" /> Export Vehicle Roster (CSV)
            </Button>
          </div>

          {/* Report 2 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Users className="size-5" />
              </div>
              <h3 className="text-sm font-extrabold text-foreground">Student Passenger Manifest</h3>
              <p className="text-xs text-muted-foreground">
                All allocated student riders by route, designated stop, and morning/afternoon timing windows.
              </p>
              <p className="text-[11px] font-bold text-emerald-600">
                {assignments.length} Student Allocations
              </p>
            </div>
            <Button
              onClick={exportStudentManifest}
              disabled={assignments.length === 0}
              variant="hero"
              size="sm"
              className="rounded-xl text-xs font-bold shadow-soft w-full"
            >
              <Download className="size-3.5 mr-1.5" /> Export Passenger Manifest (CSV)
            </Button>
          </div>

          {/* Report 3 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <Wrench className="size-5" />
              </div>
              <h3 className="text-sm font-extrabold text-foreground">Maintenance & Service Expenses</h3>
              <p className="text-xs text-muted-foreground">
                Recorded service logs, breakdown repairs, tyre/battery replacements, and total actual costs.
              </p>
              <p className="text-[11px] font-bold text-blue-600">
                {maintenance.length} Maintenance Records
              </p>
            </div>
            <Button
              onClick={exportMaintenanceLedger}
              disabled={maintenance.length === 0}
              variant="hero"
              size="sm"
              className="rounded-xl text-xs font-bold shadow-soft w-full"
            >
              <Download className="size-3.5 mr-1.5" /> Export Maintenance Ledger (CSV)
            </Button>
          </div>

          {/* Report 4 */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <ShieldAlert className="size-5" />
              </div>
              <h3 className="text-sm font-extrabold text-foreground">
                Compliance & Roadworthiness Audit
              </h3>
              <p className="text-xs text-muted-foreground">
                Insurance, fitness certificates, commercial permits, and pollution check expiry register.
              </p>
              <p className="text-[11px] font-bold text-amber-600">
                {vehicles.length} Vehicles Audited
              </p>
            </div>
            <Button
              onClick={exportComplianceReport}
              disabled={vehicles.length === 0}
              variant="hero"
              size="sm"
              className="rounded-xl text-xs font-bold shadow-soft w-full"
            >
              <Download className="size-3.5 mr-1.5" /> Export Compliance Audit (CSV)
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
