import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Route as RouteIcon,
  ArrowLeft,
  Bus,
  UserCheck,
  MapPin,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getRoute,
  listStudentAssignments,
  listTrips,
} from "@/services/transportService";
import type {
  TransportRoute,
  StudentTransportAssignment,
  TransportTrip,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const RouteDetailView: React.FC = () => {
  const { routeId } = useParams({ from: "/transport/routes/$routeId" });
  const { organization } = useAuth();

  const [route, setRoute] = useState<TransportRoute | null>(null);
  const [students, setStudents] = useState<StudentTransportAssignment[]>([]);
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "stops" | "students" | "trips">("overview");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRouteData = async () => {
    if (!organization || !routeId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [r, sList, tList] = await Promise.all([
        getRoute(organization.id, routeId),
        listStudentAssignments(organization.id, { routeId }),
        listTrips(organization.id, { routeId }),
      ]);
      setRoute(r);
      setStudents(sList.filter((s) => s.status === "Active"));
      setTrips(tList);
    } catch (err: any) {
      console.error("loadRouteData error:", err);
      setError(err.message || "Failed to load route details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRouteData();
  }, [organization, routeId]);

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !route) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Route Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The route does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/transport/routes">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Routes
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
              <RouteIcon className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{route.name}</h1>
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {route.code}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold border bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  {route.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Timings: {route.startTime} - {route.endTime} • {(route.stops || []).length} Designated Stops
              </p>
            </div>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Assigned Vehicle</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {route.vehicleNumber || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Primary Driver</span>
            <p className="text-xs font-bold text-foreground mt-1">
              {route.driverName || "Unassigned"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-emerald-600 uppercase font-bold">Students Assigned</span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">{students.length} Passengers</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Total Stops</span>
            <p className="text-lg font-black text-foreground mt-0.5">{(route.stops || []).length} Waypoints</p>
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
            onClick={() => setActiveTab("stops")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "stops"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Stops Sequence ({(route.stops || []).length})
          </button>
          <button
            onClick={() => setActiveTab("students")}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
              activeTab === "students"
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Passenger Students ({students.length})
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
              Route Details
            </h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {route.description || "No operational description provided for this route."}
            </p>
            <dl className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div>
                <dt className="text-[10px] text-muted-foreground">Start Schedule</dt>
                <dd className="font-semibold text-foreground">{route.startTime}</dd>
              </div>
              <div>
                <dt className="text-[10px] text-muted-foreground">Arrival Schedule</dt>
                <dd className="font-semibold text-foreground">{route.endTime}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
              Asset Allocations
            </h2>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface/50 border border-border">
                <span className="text-muted-foreground">Assigned Vehicle</span>
                <span className="font-bold text-foreground">
                  {route.vehicleNumber || "None"}
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-2xl bg-surface/50 border border-border">
                <span className="text-muted-foreground">Assigned Driver</span>
                <span className="font-bold text-foreground">{route.driverName || "None"}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Stops */}
      {activeTab === "stops" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Sequenced Route Stops
          </h2>
          {(route.stops || []).length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No designated stops configured on this route.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Seq</th>
                    <th className="py-2.5 px-4">Stop Name</th>
                    <th className="py-2.5 px-4">Address / Waypoint</th>
                    <th className="py-2.5 px-4">Pickup Time</th>
                    <th className="py-2.5 px-4">Drop Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {route.stops.map((stop) => (
                    <tr key={stop.sequence} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-mono font-bold text-primary">
                        #{stop.sequence}
                      </td>
                      <td className="py-2.5 px-4 font-bold text-foreground">{stop.stopName}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{stop.address || "—"}</td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">
                        {stop.pickupTime}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">{stop.dropTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Passenger Students */}
      {activeTab === "students" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Assigned Student Commuters
          </h2>
          {students.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No students assigned to this route.
            </p>
          ) : (
            <div className="rounded-2xl border border-border overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                    <th className="py-2.5 px-4">Student Name</th>
                    <th className="py-2.5 px-4">Admission No.</th>
                    <th className="py-2.5 px-4">Class</th>
                    <th className="py-2.5 px-4">Designated Stop</th>
                    <th className="py-2.5 px-4">Option</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-surface/50">
                      <td className="py-2.5 px-4 font-bold text-foreground">{s.studentName}</td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-primary">
                        {s.admissionNumber}
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground">
                        {s.className} - {s.sectionName}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-foreground">{s.stopName}</td>
                      <td className="py-2.5 px-4 text-muted-foreground">{s.pickupDrop}</td>
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
            Run Logs
          </h2>
          {trips.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No trips logged for this route.
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
                      {t.tripType} — {t.date}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Vehicle: {t.vehicleNumber} • Driver: {t.driverName}
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
