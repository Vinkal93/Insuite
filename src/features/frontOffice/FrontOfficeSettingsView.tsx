import React, { useState, useEffect } from "react";
import { Settings, Save, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getFrontOfficeSettings,
  updateFrontOfficeSettings,
} from "@/services/frontOfficeService";
import type { FrontOfficeSettingsConfig } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const FrontOfficeSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<FrontOfficeSettingsConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const cfg = await getFrontOfficeSettings(organization.id);
      setSettings(cfg);
    } catch (err) {
      console.error("loadFrontOfficeSettings error:", err);
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
      await updateFrontOfficeSettings(organization.id, settings, {
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
          Front Desk & Security Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure gate pass prefixes, validity rules, security ID proof checks, and privacy masking.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Front office settings updated successfully.
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Gate Pass Number Prefix *
              </label>
              <input
                type="text"
                required
                value={settings.gatePassPrefix}
                onChange={(e) =>
                  setSettings({ ...settings, gatePassPrefix: e.target.value })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Default Pass Validity (Hours) *
              </label>
              <input
                type="number"
                min={1}
                max={24}
                required
                value={settings.defaultPassValidityHours}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    defaultPassValidityHours: parseInt(e.target.value) || 4,
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
                checked={settings.maskIdNumbers}
                onChange={(e) =>
                  setSettings({ ...settings, maskIdNumbers: e.target.checked })
                }
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <span className="font-semibold text-foreground">
                Mask Visitor ID Numbers (e.g. XXXX-1234) for privacy
              </span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.requireIdProof}
                onChange={(e) =>
                  setSettings({ ...settings, requireIdProof: e.target.checked })
                }
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <span className="font-semibold text-foreground">
                Mandatory National ID Proof for all external visitors
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
