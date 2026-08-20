import React, { useState, useEffect } from "react";
import { Settings, Save, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getDocumentSettings, updateDocumentSettings } from "@/services/documentService";
import type { DocumentSettingsConfig } from "@/types/document";
import { Button } from "@/components/ui/button";

export const DocumentSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<DocumentSettingsConfig | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const loadSettings = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const cfg = await getDocumentSettings(organization.id);
      setSettings(cfg);
    } catch (err) {
      console.error("loadDocumentSettings error:", err);
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
      await updateDocumentSettings(organization.id, settings, {
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
          Document & Certificate Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure numbering sequences, prefixes, default signatories, and QR verification options.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Document configuration saved successfully.
        </div>
      )}

      {settings && (
        <form onSubmit={handleSave} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Certificate Number Prefix *
              </label>
              <input
                type="text"
                required
                value={settings.certificatePrefix}
                onChange={(e) =>
                  setSettings({ ...settings, certificatePrefix: e.target.value })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                ID Card Number Prefix *
              </label>
              <input
                type="text"
                required
                value={settings.idCardPrefix}
                onChange={(e) => setSettings({ ...settings, idCardPrefix: e.target.value })}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">
                Default Signatory Name *
              </label>
              <input
                type="text"
                required
                value={settings.defaultSignatoryName}
                onChange={(e) =>
                  setSettings({ ...settings, defaultSignatoryName: e.target.value })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">
                Default Signatory Designation *
              </label>
              <input
                type="text"
                required
                value={settings.defaultSignatoryDesignation}
                onChange={(e) =>
                  setSettings({ ...settings, defaultSignatoryDesignation: e.target.value })
                }
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
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
