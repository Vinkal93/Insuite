import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Compass,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTransportSettings,
  updateTransportSettings,
} from "@/services/transportService";
import type { TransportSettingsConfig, PickupDropOption } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const TransportSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();

  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [docExpiryWarningDays, setDocExpiryWarningDays] = useState(30);
  const [allowOvercapacityAssignment, setAllowOvercapacityAssignment] = useState(false);
  const [liveTrackingConfigured, setLiveTrackingConfigured] = useState(false);
  const [trackingProvider, setTrackingProvider] = useState("");
  const [defaultTripStartTimeMorning, setDefaultTripStartTimeMorning] = useState("07:00");
  const [defaultTripStartTimeAfternoon, setDefaultTripStartTimeAfternoon] = useState("14:00");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const loadSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const conf = await getTransportSettings(organization.id);
      setSettings(conf);
      setDocExpiryWarningDays(conf.docExpiryWarningDays || 30);
      setAllowOvercapacityAssignment(conf.allowOvercapacityAssignment || false);
      setLiveTrackingConfigured(conf.liveTrackingConfigured || false);
      setTrackingProvider(conf.trackingProvider || "");
      setDefaultTripStartTimeMorning(conf.defaultTripStartTimeMorning || "07:00");
      setDefaultTripStartTimeAfternoon(conf.defaultTripStartTimeAfternoon || "14:00");
    } catch (err: any) {
      console.error("loadSettings error:", err);
      setError(err.message || "Failed to load transport settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);
    setSuccessMessage(null);

    setIsSaving(true);
    try {
      await updateTransportSettings(
        organization.id,
        {
          defaultPickupDropOption: "Both",
          docExpiryWarningDays: Number(docExpiryWarningDays),
          maxStudentCapacityBufferPercentage: 0,
          liveTrackingConfigured,
          trackingProvider: trackingProvider.trim() || null,
          allowOvercapacityAssignment,
          defaultTripStartTimeMorning,
          defaultTripStartTimeAfternoon,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setSuccessMessage("Transport settings updated successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      console.error("saveSettings error:", err);
      setError(err.message || "Failed to update settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Transport System Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure compliance expiry warning thresholds, overcapacity rules, and telematics telemetry.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMessage && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Compliance & Safety Rules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <ShieldCheck className="size-4 text-primary" /> Compliance & Expiry Audits
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Document Expiry Warning Window (Days) *
              </label>
              <input
                type="number"
                min={1}
                max={180}
                required
                value={docExpiryWarningDays}
                onChange={(e) => setDocExpiryWarningDays(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Vehicles and drivers with documents expiring within this window will be flagged as "Expiring Soon".
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Passenger Seating Strictness
              </label>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="checkbox"
                  id="allowOvercapacity"
                  checked={allowOvercapacityAssignment}
                  onChange={(e) => setAllowOvercapacityAssignment(e.target.checked)}
                  className="size-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="allowOvercapacity" className="text-xs text-foreground font-semibold">
                  Allow assigning students over bus seat capacity
                </label>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1">
                When unchecked, the system prevents route allocation when bus seats are full.
              </p>
            </div>
          </div>
        </div>

        {/* Telematics & Live GPS */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Compass className="size-4 text-amber-600" /> Fleet Telematics & GPS Integration
          </h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="liveTracking"
                checked={liveTrackingConfigured}
                onChange={(e) => setLiveTrackingConfigured(e.target.checked)}
                className="size-4 rounded border-border text-primary focus:ring-primary"
              />
              <label htmlFor="liveTracking" className="text-xs text-foreground font-semibold">
                Enable Hardware GPS / OBD-II Telematics Integration
              </label>
            </div>

            {liveTrackingConfigured && (
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Telematics Provider / API Gateway Name
                </label>
                <input
                  type="text"
                  value={trackingProvider}
                  onChange={(e) => setTrackingProvider(e.target.value)}
                  placeholder="e.g. Traccar Server / Teltonika FMB920"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            )}
          </div>
        </div>

        {/* Default Trip Timings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3 flex items-center gap-2">
            <Clock className="size-4 text-primary" /> Default Transit Windows
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Default Morning Pickup Start
              </label>
              <input
                type="time"
                value={defaultTripStartTimeMorning}
                onChange={(e) => setDefaultTripStartTimeMorning(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Default Afternoon Drop Start
              </label>
              <input
                type="time"
                value={defaultTripStartTimeAfternoon}
                onChange={(e) => setDefaultTripStartTimeAfternoon(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSaving}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            <Save className="size-3.5 mr-1.5" />
            {isSaving ? "Saving..." : "Save Transport Settings"}
          </Button>
        </div>
      </form>
    </div>
  );
};
