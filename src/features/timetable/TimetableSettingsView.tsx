import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  Calendar,
  ShieldCheck,
  UserCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { timetableSettingsSchema, type TimetableSettingsInput } from "@/schemas";
import { getTimetableSettings, updateTimetableSettings } from "@/services";
import type { DayOfWeek } from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

const ALL_DAYS: DayOfWeek[] = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const TimetableSettingsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ]);

  const form = useForm<TimetableSettingsInput>({
    resolver: zodResolver(timetableSettingsSchema),
    defaultValues: {
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      defaultView: "grid",
      allowSaturday: true,
      allowSunday: false,
      conflictRules: {
        teacher: true,
        class: true,
        room: true,
      },
      substitutionSettings: {
        notifyTeacher: false,
        autoDetectAbsences: true,
      },
    },
  });

  useEffect(() => {
    if (!organization) return;
    getTimetableSettings(organization.id).then((sett) => {
      form.reset(sett);
      if (sett.workingDays) setSelectedDays(sett.workingDays);
    });
  }, [organization]);

  const toggleDay = (day: DayOfWeek) => {
    let updated: DayOfWeek[];
    if (selectedDays.includes(day)) {
      updated = selectedDays.filter((d) => d !== day);
    } else {
      updated = [...selectedDays, day];
    }
    setSelectedDays(updated);
    form.setValue("workingDays", updated);
  };

  const onSubmit = async (data: TimetableSettingsInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateTimetableSettings(
        organization.id,
        {
          ...data,
          workingDays: selectedDays,
        },
        firebaseUser.uid
      );
      setSuccessMsg("Timetable and conflict rules updated successfully.");
    } catch (err: any) {
      console.error("Update timetable settings error:", err);
      setErrorMsg(err.message || "Unable to save timetable settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Timetable & Scheduling Settings
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure working academic calendar days, default timetable presentation, and strict double-booking conflict rules.
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
        {/* Working Calendar Days */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Calendar className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Working Timetable Days
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

        {/* Conflict Enforcement Rules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <ShieldCheck className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Conflict Detection & Double-Booking Prevention
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="conflictTeacher"
                checked={form.watch("conflictRules.teacher")}
                onCheckedChange={(checked) =>
                  form.setValue("conflictRules.teacher", !!checked)
                }
              />
              <Label htmlFor="conflictTeacher" className="text-xs font-semibold cursor-pointer">
                Strict Teacher Conflict Check (Prevent assigning teacher to 2 classrooms in the same period)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="conflictClass"
                checked={form.watch("conflictRules.class")}
                onCheckedChange={(checked) => form.setValue("conflictRules.class", !!checked)}
              />
              <Label htmlFor="conflictClass" className="text-xs font-semibold cursor-pointer">
                Strict Classroom Conflict Check (Prevent scheduling 2 subjects for a section in the same period)
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="conflictRoom"
                checked={form.watch("conflictRules.room")}
                onCheckedChange={(checked) => form.setValue("conflictRules.room", !!checked)}
              />
              <Label htmlFor="conflictRoom" className="text-xs font-semibold cursor-pointer">
                Strict Room/Lab Conflict Check (Prevent booking the same facility for multiple classes in the same period)
              </Label>
            </div>
          </div>
        </div>

        {/* Substitution & Automation Rules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <UserCheck className="size-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Substitution & Absence Synchronization
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="autoDetectAbsences"
                checked={form.watch("substitutionSettings.autoDetectAbsences")}
                onCheckedChange={(checked) =>
                  form.setValue("substitutionSettings.autoDetectAbsences", !!checked)
                }
              />
              <Label htmlFor="autoDetectAbsences" className="text-xs font-semibold cursor-pointer">
                Highlight affected class periods when a faculty member is marked Absent or On Leave in Phase 6 Attendance
              </Label>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="notifyTeacher"
                checked={form.watch("substitutionSettings.notifyTeacher")}
                onCheckedChange={(checked) =>
                  form.setValue("substitutionSettings.notifyTeacher", !!checked)
                }
              />
              <Label htmlFor="notifyTeacher" className="text-xs font-semibold cursor-pointer">
                Send push notification/SMS to substitute teacher upon assignment
              </Label>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="hero"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            Save Timetable Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
