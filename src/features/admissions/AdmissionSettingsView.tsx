import React, { useState, useEffect, useCallback } from "react";
import {
  SlidersHorizontal,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdmissionSettings,
  updateAdmissionSettings,
} from "@/services/admissionService";
import type { AdmissionSettings } from "@/types/admission";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AdmissionSettingsView: React.FC = () => {
  const { organization } = useAuth();
  const [settings, setSettings] = useState<AdmissionSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  const [newSource, setNewSource] = useState("");
  const [newDoc, setNewDoc] = useState("");

  const fetchSettings = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const data = await getAdmissionSettings(organization.id);
      setSettings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !settings) return;
    setIsSaving(true);
    setSuccessMsg(false);
    try {
      await updateAdmissionSettings(organization.id, settings);
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddSource = () => {
    if (!settings || !newSource.trim()) return;
    setSettings({
      ...settings,
      enquirySources: [...settings.enquirySources, newSource.trim()],
    });
    setNewSource("");
  };

  const handleRemoveSource = (idx: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      enquirySources: settings.enquirySources.filter((_, i) => i !== idx),
    });
  };

  const handleAddDoc = () => {
    if (!settings || !newDoc.trim()) return;
    setSettings({
      ...settings,
      requiredDocuments: [...settings.requiredDocuments, newDoc.trim()],
    });
    setNewDoc("");
  };

  const handleRemoveDoc = (idx: number) => {
    if (!settings) return;
    setSettings({
      ...settings,
      requiredDocuments: settings.requiredDocuments.filter((_, i) => i !== idx),
    });
  };

  if (isLoading || !settings) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Admissions & CRM Settings</h1>
          <p className="text-xs text-muted-foreground">
            Configure numbering formats, required applicant documents, and lead channels.
          </p>
        </div>

        <Button
          onClick={handleSave}
          variant="hero"
          size="sm"
          disabled={isSaving}
          className="rounded-xl font-bold"
        >
          {isSaving ? <Loader2 className="size-3.5 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
          Save Settings
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-xl border border-success/20 bg-success/10 p-3.5 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Admission settings updated successfully!</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Identifier Prefixes */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-2">
            Identifiers & Numbering
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-xs font-semibold">Admission Prefix</Label>
              <Input
                value={settings.admissionPrefix}
                onChange={(e) => setSettings({ ...settings, admissionPrefix: e.target.value })}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Application Prefix</Label>
              <Input
                value={settings.applicationPrefix}
                onChange={(e) => setSettings({ ...settings, applicationPrefix: e.target.value })}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Enquiry Prefix</Label>
              <Input
                value={settings.enquiryPrefix}
                onChange={(e) => setSettings({ ...settings, enquiryPrefix: e.target.value })}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Start Sequence</Label>
              <Input
                type="number"
                value={settings.admissionStartNumber}
                onChange={(e) => setSettings({ ...settings, admissionStartNumber: parseInt(e.target.value) || 1001 })}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>
          </div>
        </div>

        {/* Lead Sources */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-2">
            Enquiry Acquisition Channels
          </h2>

          <div className="flex gap-2">
            <Input
              placeholder="Add new channel (e.g. Newspaper, Banner)..."
              value={newSource}
              onChange={(e) => setNewSource(e.target.value)}
              className="rounded-xl border-border bg-surface text-xs"
            />
            <Button variant="outline" size="sm" onClick={handleAddSource} className="rounded-xl">
              <Plus className="size-3.5 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.enquirySources.map((s, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs">
                <span>{s}</span>
                <button type="button" onClick={() => handleRemoveSource(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Required Applicant Documents */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs lg:col-span-2">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-2">
            Required Documents Checklist
          </h2>

          <div className="flex gap-2 max-w-md">
            <Input
              placeholder="Add required certificate..."
              value={newDoc}
              onChange={(e) => setNewDoc(e.target.value)}
              className="rounded-xl border-border bg-surface text-xs"
            />
            <Button variant="outline" size="sm" onClick={handleAddDoc} className="rounded-xl">
              <Plus className="size-3.5 mr-1" /> Add
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {settings.requiredDocuments.map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs">
                <span>{d}</span>
                <button type="button" onClick={() => handleRemoveDoc(i)} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="size-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
