import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Bus,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createVehicle } from "@/services/transportService";
import type { VehicleType, FuelType, OwnershipType, VehicleStatus } from "@/types/transport";
import type { TransportVehicleInput } from "@/schemas/transport";
import { Button } from "@/components/ui/button";

export const CreateVehicleView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

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

  // Compliance Expiry Dates
  const [insuranceExpiry, setInsuranceExpiry] = useState("");
  const [fitnessExpiry, setFitnessExpiry] = useState("");
  const [permitExpiry, setPermitExpiry] = useState("");
  const [pollutionExpiry, setPollutionExpiry] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!vehicleNumber.trim() || !registrationNumber.trim()) {
      setError("Vehicle Number and Registration Number are required.");
      return;
    }
    if (capacity < 1) {
      setError("Passenger seating capacity must be at least 1.");
      return;
    }

    const input: TransportVehicleInput = {
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
      insuranceExpiry: insuranceExpiry || null,
      fitnessExpiry: fitnessExpiry || null,
      permitExpiry: permitExpiry || null,
      pollutionExpiry: pollutionExpiry || null,
      status,
    };

    setIsSubmitting(true);
    try {
      const created = await createVehicle(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      navigate({ to: "/transport/vehicles/$vehicleId", params: { vehicleId: created.id } });
    } catch (err: any) {
      console.error("createVehicle error:", err);
      setError(err.message || "Failed to create vehicle record.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/transport/vehicles">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Register Fleet Vehicle
            </h1>
            <p className="text-xs text-muted-foreground">
              Add new bus, van, or staff transport vehicle to the institutional fleet.
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
        {/* SECTION A: Vehicle Profile */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">Section A: Vehicle Specifications</h2>
            <p className="text-xs text-muted-foreground">Identification and technical metrics</p>
          </div>

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
                placeholder="e.g. BUS-01"
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
                placeholder="e.g. DL-01-AB-1234"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Vehicle Type *</label>
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

          <div className="grid gap-4 sm:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Seating Capacity *
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
              <label className="block text-xs font-semibold text-foreground mb-1">Manufacturer</label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Tata Motors"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Model / Year</label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. Starbus 2024"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION B: Compliance Expiry Dates */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">
              Section B: Compliance & Permit Expiry Dates
            </h2>
            <p className="text-xs text-muted-foreground">
              Automatic roadworthiness validity tracking
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Insurance Expiry
              </label>
              <input
                type="date"
                value={insuranceExpiry}
                onChange={(e) => setInsuranceExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Fitness Expiry
              </label>
              <input
                type="date"
                value={fitnessExpiry}
                onChange={(e) => setFitnessExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Permit Expiry
              </label>
              <input
                type="date"
                value={permitExpiry}
                onChange={(e) => setPermitExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Pollution (PUC) Expiry
              </label>
              <input
                type="date"
                value={pollutionExpiry}
                onChange={(e) => setPollutionExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* SECTION C: Ownership & Status */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">Section C: Ownership & Status</h2>
            <p className="text-xs text-muted-foreground">Asset arrangement and operational readiness</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Ownership Model
              </label>
              <select
                value={ownershipType}
                onChange={(e) => setOwnershipType(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Owned">Institutional Owned</option>
                <option value="Leased">Leased</option>
                <option value="Contracted">Third-Party Contracted</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Initial Status
              </label>
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

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/transport/vehicles">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Onboarding Vehicle..." : "Save & Onboard Vehicle"}
          </Button>
        </div>
      </form>
    </div>
  );
};
