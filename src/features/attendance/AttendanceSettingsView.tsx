import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Clock,
  ShieldCheck,
  Bell,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { attendanceSettingsSchema, type AttendanceSettingsInput } from "@/schemas";
import { getAttendanceSettings, updateAttendanceSettings } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const AttendanceSettingsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<string[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);

  const form = useForm<AttendanceSettingsInput>({
    resolver: zodResolver(attendanceSettingsSchema),
    defaultValues: {
      defaultAttendanceStatus: "present",
      lateThresholdTime: "08:30",
      halfDayThresholdHours: 4,
      allowAttendanceEditing: true,
      requireReasonForChange: true,
      enableParentNotification: false,
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    },
  });

  useEffect(() => {
    if (!organization) return;
    getAttendanceSettings(organization.id).then((sett) => {
      form.reset(sett);
      if (sett.workingDays) setSelectedDays(sett.workingDays);
    });
  }, [organization]);

  const toggleDay = (day: string) => {
    let updated: string[];
    if (selectedDays.includes(day)) {
      updated = selectedDays.filter((d) => d !== day);
    } else {
      updated = [...selectedDays, day];
    }
    setSelectedDays(updated);
    form.setValue("workingDays", updated);
  };

  const onSubmit = async (data: AttendanceSettingsInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateAttendanceSettings(
        organization.id,
        {
          ...data,
          workingDays: selectedDays,
        },
        firebaseUser.uid
      );
      setSuccessMsg("Attendance policies and configurations updated successfully.");
    } catch (err: any) {
      console.error("Update attendance settings error:", err);
      setErrorMsg(err.message || "Failed to update attendance settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Attendance Settings & Thresholds
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure grace periods, half-day rules, audit requirements, and working school days.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Timing & Thresholds */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Clock className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Timing & Grace Thresholds
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="defaultAttendanceStatus" className="text-xs font-semibold">
                Default Roll Call State
              </Label>
              <select
                id="defaultAttendanceStatus"
                {...form.register("defaultAttendanceStatus")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="present">Mark Present</option>
                <option value="absent">Mark Absent</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="lateThresholdTime" className="text-xs font-semibold">
                Late Arrival Cutoff Time
              </Label>
              <Input
                id="lateThresholdTime"
                type="time"
                {...form.register("lateThresholdTime")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="halfDayThresholdHours" className="text-xs font-semibold">
                Half-Day Minimum Hours
              </Label>
              <Input
                id="halfDayThresholdHours"
                type="number"
                min={1}
                max={8}
                {...form.register("halfDayThresholdHours")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* Security & Audit Policies */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <ShieldCheck className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Audit & Modification Rules
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowAttendanceEditing"
                checked={form.watch("allowAttendanceEditing")}
                onCheckedChange={(checked) => form.setValue("allowAttendanceEditing", !!checked)}
              />
              <Label htmlFor="allowAttendanceEditing" className="text-xs font-semibold cursor-pointer">
                Allow authorized staff to modify past attendance records
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="requireReasonForChange"
                checked={form.watch("requireReasonForChange")}
                onCheckedChange={(checked) => form.setValue("requireReasonForChange", !!checked)}
              />
              <Label htmlFor="requireReasonForChange" className="text-xs font-semibold cursor-pointer">
                Mandate written reason / justification for any status modification
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="enableParentNotification"
                checked={form.watch("enableParentNotification")}
                onCheckedChange={(checked) => form.setValue("enableParentNotification", !!checked)}
              />
              <Label htmlFor="enableParentNotification" className="text-xs font-semibold cursor-pointer">
                Auto-notify parents on unexcused student absences (SMS / WhatsApp)
              </Label>
            </div>
          </div>
        </div>

        {/* Working School Days */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Calendar className="size-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              School Working Calendar Days
            </h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {ALL_DAYS.map((day) => {
              const isSelected = selectedDays.includes(day);
              return (
                <button
                  type="button"
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-surface border border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  {day} {isSelected ? "✓" : ""}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold shadow-soft">
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-3.5 mr-1.5" />}
            Save Attendance Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
