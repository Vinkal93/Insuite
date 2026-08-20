import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  UserCheck,
  ArrowLeft,
  Bus,
  Route as RouteIcon,
  Clock,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getDriver,
  listRoutes,
  listTrips,
  calculateDocumentStatus,
  getTransportSettings,
} from "@/services/transportService";
import type {
  TransportDriver,
  TransportRoute,
  TransportTrip,
  TransportSettingsConfig,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const DriverDetailView: React.FC = () => {
  const { driverId } = useParams({ from: "/transport/drivers/$driverId" });
  const { organization } = useAuth();

  const [driver, setDriver] = useState<TransportDriver | null>(null);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "routes" | "trips">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization || !driverId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [d, rList, tList, conf] = await Promise.all([
        getDriver(organization.id, driverId),
        listRoutes(organization.id),
        listTrips(organization.id),
        getTransportSettings(organization.id),
      ]);
      setDriver(d);
      setRoutes(rList.filter((r) => r.driverId === driverId));
      setTrips(tList.filter((t) => t.driverId === driverId));
      setSettings(conf);
    } catch (err: any) {
      console.error("Driver detail load error:", err);
      setError(err.message || "Failed to load driver profile.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, driverId]);

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !driver) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Driver Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The driver does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/transport/drivers">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Drivers
          </Link>
        </Button>
      </div>
    );
  }

  const licStatus = calculateDocumentStatus(
    driver.licenseExpiry,
    settings?.docExpiryWarningDays
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <UserCheck className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{driver.name}</h1>
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {driver.employeeId}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    driver.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {driver.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                License: <span className="font-mono font-bold text-foreground">{driver.licenseNumber}</span> ({driver.licenseType})
              </p>
            </div>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Vehicle</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {driver.assignedVehicleNumber || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">License Validity</span>
            <p
              className={`text-xs font-bold mt-1 ${
                licStatus === "Expired"
                  ? "text-destructive"
                  : licStatus === "Expiring Soon"
                  ? "text-amber-600"
                  : "text-foreground"
              }`}
            >
              {driver.licenseExpiry} ({licStatus})
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Experience</span>
            <p className="text-lg font-black text-foreground mt-0.5">
              {driver.experienceYears || 0} Years
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Phone Contact</span>
            <p className="text-xs font-bold text-foreground mt-1">{driver.mobile}</p>
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
            onClick={() => setActiveTab("routes")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "routes"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Assigned Routes ({routes.length})
          </button>
          <button
            onClick={() => setActiveTab("trips")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "trips"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Trip Runs ({trips.length})
          </button>
        </div>
      </div>

      {/* Tab 1: Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Driver Dossier
            </h2>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-[10px] text-muted-foreground">Staff Member Name</dt>
                <dd className="font-semibold text-foreground">{driver.name}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Employee ID</dt>
                <dd className="font-mono font-semibold text-primary">{driver.employeeId}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Contact Phone</dt>
                <dd className="font-semibold text-foreground">{driver.mobile}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Email</dt>
                <dd className="font-semibold text-foreground">{driver.email || "—"}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Licensing & Compliance
            </h2>
            <dl className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Commercial License No.</span>
                <span className="font-mono font-bold text-foreground">
                  {driver.licenseNumber}
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">License Expiry</span>
                <span className="font-bold text-foreground">{driver.licenseExpiry}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-surface/50">
                <span className="text-muted-foreground">Medical Fitness Expiry</span>
                <span className="font-bold text-foreground">
                  {driver.medicalExpiry || "Not Recorded"}
                </span>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Tab 2: Assigned Routes */}
      {activeTab === "routes" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Assigned Routes
          </h2>
          {routes.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No routes currently assigned to this driver.
            </p>
          ) : (
            <div className="space-y-3">
              {routes.map((r) => (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      Code: {r.code} • Timings: {r.startTime} - {r.endTime}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">
                    {r.totalStudentsAssigned} Students
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Trips */}
      {activeTab === "trips" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Trip History
          </h2>
          {trips.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No trips logged for this driver.
            </p>
          ) : (
            <div className="space-y-3">
              {trips.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">
                      {t.routeName} — {t.date}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Vehicle: {t.vehicleNumber} ({t.tripType})
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-primary">{t.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
