import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getHostelSettings, updateHostelSettings } from "@/services/hostelService";
import type { HostelSettingsConfig } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<HostelSettingsConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const cfg = await getHostelSettings(organization.id);
      setSettings(cfg);
    } catch (err) {
      console.error("loadHostelSettings error:", err);
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
      await updateHostelSettings(organization.id, settings, {
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
          Hostel & Residential Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure boarding rules, night curfew hours, occupancy alerts, and student/parent out-pass permissions.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Hostel settings updated successfully.
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Night Roll Call / Curfew Time *
              </label>
              <input
                type="time"
                required
                value={settings.curfewTime}
                onChange={(e) => setSettings({ ...settings, curfewTime: e.target.value })}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Occupancy Alert Threshold (%) *
              </label>
              <input
                type="number"
                min={50}
                max={100}
                required
                value={settings.maxOccupancyAlertPercent}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxOccupancyAlertPercent: parseInt(e.target.value) || 90,
                  })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.genderStrictness}
                onChange={(e) =>
                  setSettings({ ...settings, genderStrictness: e.target.checked })
                }
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <span className="font-semibold text-foreground">
                Enforce strict gender restriction on room allocations
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowStudentLeaveRequest}
                onChange={(e) =>
                  setSettings({ ...settings, allowStudentLeaveRequest: e.target.checked })
                }
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <span className="font-semibold text-foreground">
                Allow students to submit out-pass leave requests from Student Portal
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowParentLeaveRequest}
                onChange={(e) =>
                  setSettings({ ...settings, allowParentLeaveRequest: e.target.checked })
                }
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <span className="font-semibold text-foreground">
                Allow parents to submit hostel leave requests from Parent Portal
              </span>
            </label>
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
