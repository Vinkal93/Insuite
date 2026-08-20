import React, { useState, useEffect } from "react";
import {
  Settings,
  Save,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Sliders,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getHrSettings, updateHrSettings } from "@/services/hrService";
import type { HrSettingsConfig } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const HrSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<HrSettingsConfig | null>(null);
  const [prefix, setPrefix] = useState("INS-EMP");
  const [autoGen, setAutoGen] = useState(true);
  const [thresholdDays, setThresholdDays] = useState(30);
  const [employmentTypes, setEmploymentTypes] = useState<string[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<string[]>([]);

  const [newEmploymentType, setNewEmploymentType] = useState("");
  const [newLeaveType, setNewLeaveType] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!organization) return;
      try {
        const conf = await getHrSettings(organization.id);
        setSettings(conf);
        setPrefix(conf.employeeIdPrefix);
        setAutoGen(conf.autoGenerateEmployeeId);
        setThresholdDays(conf.docExpiryWarningThresholdDays);
        setEmploymentTypes(conf.employmentTypes || []);
        setLeaveTypes(conf.leaveTypes || []);
      } catch (err: any) {
        console.error("Load HR settings error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [organization]);

  const handleAddEmploymentType = () => {
    if (!newEmploymentType.trim()) return;
    if (!employmentTypes.includes(newEmploymentType.trim())) {
      setEmploymentTypes((prev) => [...prev, newEmploymentType.trim()]);
    }
    setNewEmploymentType("");
  };

  const handleRemoveEmploymentType = (type: string) => {
    setEmploymentTypes((prev) => prev.filter((t) => t !== type));
  };

  const handleAddLeaveType = () => {
    if (!newLeaveType.trim()) return;
    if (!leaveTypes.includes(newLeaveType.trim())) {
      setLeaveTypes((prev) => [...prev, newLeaveType.trim()]);
    }
    setNewLeaveType("");
  };

  const handleRemoveLeaveType = (type: string) => {
    setLeaveTypes((prev) => prev.filter((t) => t !== type));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);
    setSuccess(false);

    setIsSubmitting(true);
    try {
      await updateHrSettings(
        organization.id,
        {
          employeeIdPrefix: prefix.trim().toUpperCase(),
          autoGenerateEmployeeId: autoGen,
          docExpiryWarningThresholdDays: Number(thresholdDays),
          employmentTypes,
          leaveTypes,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to update HR settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Staff & HR Operational Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure employee ID sequences, document expiry alerts, contracts, and leave types.
        </p>
      </div>

      {success && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>HR Settings saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Employee Numbering */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Employee Numbering & Identifiers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Employee ID Prefix *
              </label>
              <input
                type="text"
                required
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                placeholder="e.g. INS-EMP"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="autoGen"
                checked={autoGen}
                onChange={(e) => setAutoGen(e.target.checked)}
                className="size-4 rounded text-primary focus:ring-primary"
              />
              <label htmlFor="autoGen" className="text-xs font-semibold text-foreground cursor-pointer">
                Auto-generate employee numbers sequentially
              </label>
            </div>
          </div>
        </div>

        {/* Compliance Thresholds */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Compliance & Document Expiry
          </h2>
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-foreground mb-1">
              Warning Window (Days before expiry)
            </label>
            <input
              type="number"
              min={1}
              max={180}
              value={thresholdDays}
              onChange={(e) => setThresholdDays(Number(e.target.value))}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving..." : "Save HR Configuration"}
          </Button>
        </div>
      </form>
    </div>
  );
};
