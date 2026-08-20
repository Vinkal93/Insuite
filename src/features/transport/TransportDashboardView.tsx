import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bus,
  Route as RouteIcon,
  Users,
  UserCheck,
  Wrench,
  Clock,
  AlertTriangle,
  FileCheck,
  Plus,
  RefreshCw,
  AlertCircle,
  Navigation,
  Compass,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTransportDashboardStats,
  listTrips,
  listVehicles,
  getTransportSettings,
} from "@/services/transportService";
import type {
  TransportDashboardStats,
  TransportTrip,
  TransportVehicle,
  TransportSettingsConfig,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const TransportDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<TransportDashboardStats | null>(null);
  const [todayTrips, setTodayTrips] = useState<TransportTrip[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [st, trips, vList, conf] = await Promise.all([
        getTransportDashboardStats(organization.id),
        listTrips(organization.id, { date: todayStr }),
        listVehicles(organization.id),
        getTransportSettings(organization.id),
      ]);
      setStats(st);
      setTodayTrips(trips);
      setVehicles(vList);
      setSettings(conf);
    } catch (err: any) {
      console.error("Transport dashboard error:", err);
      setError(err.message || "Failed to load transport dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse p-4" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Error Loading Transport Operations</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Transport & Fleet Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fleet tracking, route schedules, driver assignments, and student transport rolls.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/transport/vehicles/new">
              <Plus className="size-3.5 mr-1.5" /> Add Vehicle
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/transport/assignments">
              <Navigation className="size-3.5 mr-1.5" /> Assign Students
            </Link>
          </Button>
        </div>
      </div>

      {/* Live GPS Connectivity Banner */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
            <Compass className="size-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold text-foreground">
              Fleet Telematics & GPS Tracking
            </h3>
            <p className="text-[11px] text-muted-foreground">
              {settings?.liveTrackingConfigured
                ? `Active Telematics Provider: ${settings.trackingProvider}`
                : "Live tracking is not configured. Real-time telemetry hardware is currently offline."}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
          <Link to="/transport/settings">Configure Telematics</Link>
        </Button>
      </div>

      {/* KPI Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Vehicles */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Fleet Strength</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Bus className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.totalVehicles ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            <span className="text-emerald-600 font-bold">{stats?.activeVehicles ?? 0} Active</span> • {stats?.maintenanceVehicles ?? 0} In Shop
          </p>
        </div>

        {/* Active Routes & Assigned Students */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Active Routes</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <RouteIcon className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{stats?.activeRoutes ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.assignedStudents ?? 0} Students Assigned
          </p>
        </div>

        {/* Drivers */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Active Drivers</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <UserCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600">{stats?.activeDrivers ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Commercial Licensed Faculty
          </p>
        </div>

        {/* Expiring Compliance Docs */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Compliance Alerts</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <FileCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{stats?.expiringDocsCount ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Insurance & Fitness Expiries
          </p>
        </div>
      </div>

      {/* Operations Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Trips */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Today's Scheduled Runs</h2>
              <p className="text-xs text-muted-foreground">Morning and afternoon student transit</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/transport/trips">All Trips ({stats?.todayTripsCount ?? 0}) →</Link>
            </Button>
          </div>

          {todayTrips.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No trips scheduled for today. Click "Trips" to plan daily routes.
            </div>
          ) : (
            <div className="space-y-3">
              {todayTrips.map((t) => (
                <div
                  key={t.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{t.routeName}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {t.vehicleNumber} • Driver: {t.driverName} ({t.tripType})
                    </p>
                    <p className="text-[9px] text-primary font-semibold mt-0.5">
                      Sched: {t.scheduledStart} - {t.scheduledEnd}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      t.status === "Completed"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : t.status === "Started"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Fleet Roster Quick View */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Fleet Readiness</h2>
              <p className="text-xs text-muted-foreground">Active vehicle roadworthiness and capacity</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/transport/vehicles">Manage Fleet ({vehicles.length}) →</Link>
            </Button>
          </div>

          {vehicles.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              Transport has not been configured yet. Add vehicles to start.
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.slice(0, 5).map((v) => (
                <div
                  key={v.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-bold text-foreground">{v.vehicleNumber}</p>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        ({v.registrationNumber})
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      {v.type} • {v.capacity} Seats • {v.fuelType}
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      v.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
