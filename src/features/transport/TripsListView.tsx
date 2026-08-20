import React, { useState, useEffect, useMemo } from "react";
import {
  Clock,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Play,
  Check,
  XCircle,
  Bus,
  Route as RouteIcon,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listTrips,
  createTrip,
  updateTripStatus,
  listRoutes,
  listVehicles,
  listDrivers,
} from "@/services/transportService";
import type {
  TransportTrip,
  TransportRoute,
  TransportVehicle,
  TransportDriver,
  TripType,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const TripsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [trips, setTrips] = useState<TransportTrip[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Schedule Trip Modal State
  const [showModal, setShowModal] = useState(false);
  const [tripRouteId, setTripRouteId] = useState("");
  const [tripVehicleId, setTripVehicleId] = useState("");
  const [tripDriverId, setTripDriverId] = useState("");
  const [tripDate, setTripDate] = useState(new Date().toISOString().split("T")[0]);
  const [tripType, setTripType] = useState<TripType>("Morning Pickup");
  const [scheduledStart, setScheduledStart] = useState("07:00");
  const [scheduledEnd, setScheduledEnd] = useState("08:15");
  const [remarks, setRemarks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [tList, rList, vList, dList] = await Promise.all([
        listTrips(organization.id),
        listRoutes(organization.id, { status: "Active" }),
        listVehicles(organization.id, { status: "Active" }),
        listDrivers(organization.id),
      ]);
      setTrips(tList);
      setRoutes(rList);
      setVehicles(vList);
      setDrivers(dList.filter((d) => d.status === "Active"));

      if (rList.length > 0) {
        setTripRouteId(rList[0].id);
        if (rList[0].vehicleId) setTripVehicleId(rList[0].vehicleId);
        if (rList[0].driverId) setTripDriverId(rList[0].driverId);
      }
    } catch (err: any) {
      console.error("loadTrips error:", err);
      setError(err.message || "Failed to load trip runs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleRouteChange = (rId: string) => {
    setTripRouteId(rId);
    const r = routes.find((route) => route.id === rId);
    if (r) {
      if (r.vehicleId) setTripVehicleId(r.vehicleId);
      if (r.driverId) setTripDriverId(r.driverId);
      setScheduledStart(r.startTime);
      setScheduledEnd(r.endTime);
    }
  };

  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setModalError(null);

    if (!tripRouteId || !tripVehicleId || !tripDriverId) {
      setModalError("Please select route, active vehicle, and active driver.");
      return;
    }

    setIsSubmitting(true);
    try {
      await createTrip(
        organization.id,
        {
          routeId: tripRouteId,
          vehicleId: tripVehicleId,
          driverId: tripDriverId,
          date: tripDate,
          tripType,
          scheduledStart,
          scheduledEnd,
          remarks: remarks.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowModal(false);
      await loadData();
    } catch (err: any) {
      setModalError(err.message || "Failed to schedule trip.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStartTrip = async (tripId: string) => {
    if (!organization || !firebaseUser) return;
    const nowTime = new Date().toTimeString().slice(0, 5);
    try {
      await updateTripStatus(organization.id, tripId, "Started", nowTime, null, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to start trip: " + err.message);
    }
  };

  const handleCompleteTrip = async (tripId: string) => {
    if (!organization || !firebaseUser) return;
    const nowTime = new Date().toTimeString().slice(0, 5);
    try {
      await updateTripStatus(organization.id, tripId, "Completed", undefined, nowTime, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to complete trip: " + err.message);
    }
  };

  const handleCancelTrip = async (tripId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to cancel this scheduled run?")) return;
    try {
      await updateTripStatus(organization.id, tripId, "Cancelled", undefined, undefined, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to cancel trip: " + err.message);
    }
  };

  const filteredTrips = useMemo(() => {
    return trips.filter((t) => {
      const matchesDate = !selectedDate || t.date === selectedDate;
      const matchesType = typeFilter === "ALL" || t.tripType === typeFilter;
      return matchesDate && matchesType;
    });
  }, [trips, selectedDate, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Trip Logs & Operational Runs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time tracking of morning pickup runs, afternoon drops, and special shuttles.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => {
            setModalError(null);
            setShowModal(true);
          }}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Schedule Run
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-xl">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
              Filter by Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-[10px] text-muted-foreground uppercase font-bold mb-1">
              Trip Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Trip Types</option>
              <option value="Morning Pickup">Morning Pickup</option>
              <option value="Afternoon Drop">Afternoon Drop</option>
              <option value="Special">Special Trip</option>
            </select>
          </div>
        </div>
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
      ) : filteredTrips.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Clock className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No trips scheduled for this date</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Schedule morning and afternoon runs for active routes.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModal(true)}
            className="mt-4 rounded-xl text-xs"
          >
            <Plus className="size-3.5 mr-1" /> Schedule Run
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Trip Type</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Driver</th>
                <th className="py-3 px-4">Scheduled Window</th>
                <th className="py-3 px-4">Actual Times</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Lifecycle Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTrips.map((t) => (
                <tr key={t.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-foreground">{t.date}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{t.routeName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.tripType}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{t.vehicleNumber}</td>
                  <td className="py-3 px-4 text-muted-foreground">{t.driverName}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">
                    {t.scheduledStart} - {t.scheduledEnd}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    {t.actualStart || "—"} / {t.actualEnd || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                        t.status === "Completed"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : t.status === "Started"
                          ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                          : t.status === "Cancelled"
                          ? "bg-destructive/10 text-destructive border-destructive/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status === "Scheduled" && (
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleStartTrip(t.id)}
                          className="h-7 px-2 text-xs font-bold"
                        >
                          <Play className="size-3 mr-1" /> Start Run
                        </Button>
                      )}
                      {t.status === "Started" && (
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleCompleteTrip(t.id)}
                          className="h-7 px-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="size-3 mr-1" /> Complete
                        </Button>
                      )}
                      {(t.status === "Scheduled" || t.status === "Started") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelTrip(t.id)}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="size-3" />
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

      {/* Schedule Trip Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-extrabold text-foreground">Schedule Transit Run</h3>

            {modalError && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Transit Route *
                </label>
                <select
                  value={tripRouteId}
                  onChange={(e) => handleRouteChange(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {routes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Assigned Vehicle *
                  </label>
                  <select
                    value={tripVehicleId}
                    onChange={(e) => setTripVehicleId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.vehicleNumber} ({v.type} - {v.capacity} Seats)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Primary Driver *
                  </label>
                  <select
                    value={tripDriverId}
                    onChange={(e) => setTripDriverId(e.target.value)}
                    required
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Run Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={tripDate}
                    onChange={(e) => setTripDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Trip Type
                  </label>
                  <select
                    value={tripType}
                    onChange={(e) => setTripType(e.target.value as any)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Morning Pickup">Morning Pickup</option>
                    <option value="Afternoon Drop">Afternoon Drop</option>
                    <option value="Special">Special / Event Trip</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Scheduled Start *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledStart}
                    onChange={(e) => setScheduledStart(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Scheduled End *
                  </label>
                  <input
                    type="time"
                    required
                    value={scheduledEnd}
                    onChange={(e) => setScheduledEnd(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowModal(false)}
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
                  {isSubmitting ? "Scheduling..." : "Confirm Schedule"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
