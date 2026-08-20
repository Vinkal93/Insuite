import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "@tanstack/react-router";
import {
  Bus,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getVehicle, updateVehicle } from "@/services/transportService";
import type { VehicleType, FuelType, OwnershipType, VehicleStatus, TransportVehicle } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const EditVehicleView: React.FC = () => {
  const { vehicleId } = useParams({ from: "/transport/vehicles/$vehicleId/edit" });
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<TransportVehicle | null>(null);
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [type, setType] = useState<VehicleType>("Bus");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [capacity, setCapacity] = useState<number>(32);
  const [fuelType, setFuelType] = useState<FuelType>("Diesel");
  const [color, setColor] = useState("Yellow");
  const [ownershipType, setOwnershipType] = useState<OwnershipType>("Owned");
  const [status, setStatus] = useState<VehicleStatus>("Active");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization || !vehicleId) return;
      try {
        const v = await getVehicle(organization.id, vehicleId);
        if (!v) {
          setError("Vehicle not found.");
          return;
        }
        setVehicle(v);
        setVehicleNumber(v.vehicleNumber);
        setRegistrationNumber(v.registrationNumber);
        setType(v.type);
        setManufacturer(v.manufacturer || "");
        setModel(v.model || "");
        setYear(v.year || new Date().getFullYear());
        setCapacity(v.capacity);
        setFuelType(v.fuelType);
        setColor(v.color || "Yellow");
        setOwnershipType(v.ownershipType);
        setStatus(v.status);
      } catch (err: any) {
        setError(err.message || "Failed to load vehicle for editing.");
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, [organization, vehicleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !vehicleId) return;
    setError(null);

    setIsSubmitting(true);
    try {
      await updateVehicle(
        organization.id,
        vehicleId,
        {
          vehicleNumber: vehicleNumber.trim().toUpperCase(),
          registrationNumber: registrationNumber.trim().toUpperCase(),
          type,
          manufacturer: manufacturer.trim() || null,
          model: model.trim() || null,
          year: year ? Number(year) : null,
          capacity: Number(capacity),
          fuelType,
          color: color.trim() || null,
          ownershipType,
          status,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/transport/vehicles/$vehicleId", params: { vehicleId } });
    } catch (err: any) {
      setError(err.message || "Failed to update vehicle record.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error && !vehicle) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
        <Button variant="outline" size="sm" asChild className="mt-3 text-xs">
          <Link to="/transport/vehicles">Return</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/transport/vehicles/$vehicleId" params={{ vehicleId: vehicle!.id }}>
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Edit Vehicle Specifications
            </h1>
            <p className="text-xs text-muted-foreground">
              Update fleet metadata, seating capacity, and status.
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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Specifications & Capacity
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Vehicle Internal No. *
              </label>
              <input
                type="text"
                required
                value={vehicleNumber}
                onChange={(e) => setVehicleNumber(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Registration Plate No. *
              </label>
              <input
                type="text"
                required
                value={registrationNumber}
                onChange={(e) => setRegistrationNumber(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Vehicle Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Bus">School Bus</option>
                <option value="Van">Van / Minibus</option>
                <option value="Car">Staff Car</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Passenger Seats *
              </label>
              <input
                type="number"
                min={1}
                max={120}
                required
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Fuel Type</label>
              <select
                value={fuelType}
                onChange={(e) => setFuelType(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Diesel">Diesel</option>
                <option value="CNG">CNG</option>
                <option value="Petrol">Petrol</option>
                <option value="Electric">Electric (EV)</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Active">Active & In Service</option>
                <option value="Inactive">Inactive / Spare</option>
                <option value="Maintenance">Under Maintenance</option>
                <option value="Retired">Retired</option>
              </select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/transport/vehicles/$vehicleId" params={{ vehicleId: vehicle!.id }}>
              Cancel
            </Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving..." : "Save Vehicle Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
};
