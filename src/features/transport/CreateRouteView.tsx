import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Route as RouteIcon,
  ArrowLeft,
  Save,
  AlertCircle,
  Plus,
  Trash2,
  MapPin,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createRoute,
  listVehicles,
  listDrivers,
  listStops,
} from "@/services/transportService";
import type {
  TransportVehicle,
  TransportDriver,
  TransportStop,
  TransportRouteStopItem,
} from "@/types/transport";
import { Button } from "@/components/ui/button";

export const CreateRouteView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [availableStops, setAvailableStops] = useState<TransportStop[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("07:00");
  const [endTime, setEndTime] = useState("08:15");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [routeStops, setRouteStops] = useState<TransportRouteStopItem[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [vList, dList, sList] = await Promise.all([
          listVehicles(organization.id, { status: "Active" }),
          listDrivers(organization.id),
          listStops(organization.id),
        ]);
        setVehicles(vList);
        setDrivers(dList.filter((d) => d.status === "Active"));
        setAvailableStops(sList);
      } catch (err: any) {
        console.error("Init route form error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const handleAddStopToRoute = () => {
    if (availableStops.length === 0) {
      alert("No stops defined. Please create stops in the Stops section first.");
      return;
    }
    const nextSeq = routeStops.length + 1;
    const defaultStop = availableStops[0];
    setRouteStops((prev) => [
      ...prev,
      {
        stopId: defaultStop.id,
        stopName: defaultStop.name,
        stopCode: defaultStop.code || null,
        address: defaultStop.address || null,
        pickupTime: defaultStop.defaultPickupTime || "07:15",
        dropTime: defaultStop.defaultDropTime || "14:45",
        sequence: nextSeq,
      },
    ]);
  };

  const handleRemoveStop = (index: number) => {
    setRouteStops((prev) => {
      const updated = prev.filter((_, i) => i !== index);
      return updated.map((s, idx) => ({ ...s, sequence: idx + 1 }));
    });
  };

  const handleStopChange = (index: number, stopId: string) => {
    const stopObj = availableStops.find((s) => s.id === stopId);
    if (!stopObj) return;

    setRouteStops((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        stopId: stopObj.id,
        stopName: stopObj.name,
        stopCode: stopObj.code || null,
        address: stopObj.address || null,
      };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!name.trim() || !code.trim()) {
      setError("Route name and code are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createRoute(
        organization.id,
        {
          name: name.trim(),
          code: code.trim().toUpperCase(),
          description: description.trim() || null,
          startTime,
          endTime,
          vehicleId: vehicleId || null,
          driverId: driverId || null,
          stops: routeStops,
          status: "Active",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/transport/routes/$routeId", params: { routeId: created.id } });
    } catch (err: any) {
      console.error("Create route error:", err);
      setError(err.message || "Failed to create route.");
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
            <Link to="/transport/routes">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Create Transit Route
            </h1>
            <p className="text-xs text-muted-foreground">
              Define route path, sequence designated stops, and assign fleet assets.
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
        {/* Route Details */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Route Profile & Timings
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Route Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. North City Express (Route A)"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Route Code *
              </label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. RT-01"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Start Time *
              </label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">End Time *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Assigned Vehicle
              </label>
              <select
                value={vehicleId}
                onChange={(e) => setVehicleId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None (Assign Later)</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.vehicleNumber} ({v.type} - {v.capacity} Seats)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Primary Driver
              </label>
              <select
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None (Assign Later)</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.employeeId})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stops Sequence Builder */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Designated Stops & Sequence</h2>
              <p className="text-xs text-muted-foreground">
                Ordered pickup and drop locations along the route path
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddStopToRoute}
              className="rounded-xl text-xs h-8 font-semibold"
            >
              <Plus className="size-3.5 mr-1" /> Add Stop to Route
            </Button>
          </div>

          {routeStops.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-4 text-center">
              No stops added to this route yet. Click "Add Stop to Route" to configure path.
            </p>
          ) : (
            <div className="space-y-3">
              {routeStops.map((stop, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center gap-3 flex-wrap sm:flex-nowrap"
                >
                  <span className="font-mono font-bold text-xs text-primary px-2 py-1 rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                    #{stop.sequence}
                  </span>

                  <div className="flex-1 min-w-[200px]">
                    <select
                      value={stop.stopId}
                      onChange={(e) => handleStopChange(idx, e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground"
                    >
                      {availableStops.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} {s.address ? `(${s.address})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-28 shrink-0">
                    <label className="block text-[9px] text-muted-foreground font-semibold">
                      Pickup Time
                    </label>
                    <input
                      type="time"
                      value={stop.pickupTime}
                      onChange={(e) => {
                        const updated = [...routeStops];
                        updated[idx].pickupTime = e.target.value;
                        setRouteStops(updated);
                      }}
                      className="w-full rounded-xl border border-border bg-card px-2 py-1 text-xs text-foreground"
                    />
                  </div>

                  <div className="w-28 shrink-0">
                    <label className="block text-[9px] text-muted-foreground font-semibold">
                      Drop Time
                    </label>
                    <input
                      type="time"
                      value={stop.dropTime}
                      onChange={(e) => {
                        const updated = [...routeStops];
                        updated[idx].dropTime = e.target.value;
                        setRouteStops(updated);
                      }}
                      className="w-full rounded-xl border border-border bg-card px-2 py-1 text-xs text-foreground"
                    />
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveStop(idx)}
                    className="text-destructive h-8 px-2 shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/transport/routes">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Creating Route..." : "Save Transit Route"}
          </Button>
        </div>
      </form>
    </div>
  );
};
