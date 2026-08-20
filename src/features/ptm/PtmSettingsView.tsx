import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getPtmSettings, updatePtmSettings } from "@/services/ptmService";
import type { PtmSettingsConfig } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<PtmSettingsConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const cfg = await getPtmSettings(organization.id);
      setSettings(cfg);
    } catch (err) {
      console.error("loadPtmSettings error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [organization]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !settings) return;

    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updatePtmSettings(organization.id, settings, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          PTM Module Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure default conference slot intervals, cancellation policies, and booking rules.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> PTM configuration saved successfully.
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Default Slot Duration (Minutes) *
              </label>
              <input
                type="number"
                required
                min="5"
                max="60"
                value={settings.defaultSlotDuration}
                onChange={(e) =>
                  setSettings({ ...settings, defaultSlotDuration: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Cancellation Window (Hours Before Meeting) *
              </label>
              <input
                type="number"
                required
                min="0"
                max="72"
                value={settings.cancellationWindowHours}
                onChange={(e) =>
                  setSettings({ ...settings, cancellationWindowHours: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Max Bookings Per Parent (Per Event) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="20"
                value={settings.maxAppointmentsPerParent}
                onChange={(e) =>
                  setSettings({ ...settings, maxAppointmentsPerParent: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Reminder Notice (Hours Before) *
              </label>
              <input
                type="number"
                required
                min="1"
                max="72"
                value={settings.reminderTimingHours}
                onChange={(e) =>
                  setSettings({ ...settings, reminderTimingHours: Number(e.target.value) })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-border flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSaving}
              className="rounded-xl text-xs font-bold"
            >
              <Save className="size-3.5 mr-1.5" />
              {isSaving ? "Saving..." : "Save Settings"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
