import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarRange,
  ArrowLeft,
  GraduationCap,
  Layers,
  BookOpen,
  Users,
  Building2,
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { timetableEntrySchema, type TimetableEntryInput } from "@/schemas";
import {
  getSchoolClasses,
  getSections,
  getSubjects,
  getTeachers,
  getRooms,
  getPeriods,
  getAcademicSessionsList,
  getTimetableSettings,
  createTimetableEntry,
  checkTimetableConflicts,
} from "@/services";
import type {
  SchoolClass,
  Section,
  Subject,
  Teacher,
  Room,
  Period,
  AcademicSessionItem,
  DayOfWeek,
  TimetableSettingsConfig,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export const CreateTimetableEntryView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const navigate = useNavigate();

  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [roomsList, setRoomsList] = useState<Room[]>([]);
  const [periodsList, setPeriodsList] = useState<Period[]>([]);
  const [sessionsList, setSessionsList] = useState<AcademicSessionItem[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsConfig | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [conflictWarning, setConflictWarning] = useState<string | null>(null);
  const [isCheckingConflict, setIsCheckingConflict] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const form = useForm<TimetableEntryInput>({
    resolver: zodResolver(timetableEntrySchema),
    defaultValues: {
      academicSessionId: selectedSession?.id || "",
      classId: "",
      sectionId: "",
      subjectId: "",
      teacherId: "",
      roomId: null,
      dayOfWeek: "Monday",
      periodId: "",
    },
  });

  const selectedClassId = form.watch("classId");
  const selectedSectionId = form.watch("sectionId");
  const selectedPeriodId = form.watch("periodId");
  const selectedTeacherId = form.watch("teacherId");
  const selectedRoomId = form.watch("roomId");
  const selectedDay = form.watch("dayOfWeek");
  const selectedSessionId = form.watch("academicSessionId");

  // Load initial data
  useEffect(() => {
    if (!organization) return;
    setIsLoading(true);
    Promise.all([
      getSchoolClasses(organization.id, selectedSession?.id),
      getSubjects(organization.id),
      getTeachers(organization.id, "active"),
      getRooms(organization.id),
      getPeriods(organization.id),
      getAcademicSessionsList(organization.id),
      getTimetableSettings(organization.id),
    ]).then(([classes, subjects, teachers, rooms, periods, sessions, sett]) => {
      setClassesList(classes);
      setSubjectsList(subjects);
      setTeachersList(teachers);
      setRoomsList(rooms);
      setPeriodsList(periods);
      setSessionsList(sessions);
      setSettings(sett);

      if (classes.length > 0) {
        form.setValue("classId", classes[0].id);
      }
      if (periods.length > 0) {
        const regularPeriods = periods.filter((p) => p.type === "Regular");
        if (regularPeriods.length > 0) {
          form.setValue("periodId", regularPeriods[0].id);
        }
      }
      if (sessions.length > 0 && !selectedSessionId) {
        const active = sessions.find((s) => s.isActive) || sessions[0];
        form.setValue("academicSessionId", active.id);
      }
      setIsLoading(false);
    });
  }, [organization, selectedSession]);

  // Load sections when class changes
  useEffect(() => {
    if (!organization || !selectedClassId) return;
    getSections(organization.id, selectedClassId, selectedSessionId).then((secs) => {
      setSectionsList(secs);
      if (secs.length > 0) {
        form.setValue("sectionId", secs[0].id);
      } else {
        form.setValue("sectionId", "");
      }
    });
  }, [organization, selectedClassId, selectedSessionId]);

  // Check live conflict when key fields change
  useEffect(() => {
    if (
      !organization ||
      !selectedSessionId ||
      !selectedClassId ||
      !selectedSectionId ||
      !selectedTeacherId ||
      !selectedPeriodId ||
      !selectedDay
    ) {
      setConflictWarning(null);
      return;
    }

    setIsCheckingConflict(true);
    checkTimetableConflicts(organization.id, {
      academicSessionId: selectedSessionId,
      classId: selectedClassId,
      sectionId: selectedSectionId,
      subjectId: form.watch("subjectId") || "",
      teacherId: selectedTeacherId,
      roomId: selectedRoomId || null,
      dayOfWeek: selectedDay,
      periodId: selectedPeriodId,
    })
      .then((res) => {
        if (res.hasConflict) {
          setConflictWarning(res.message || "Conflict detected with this time slot.");
        } else {
          setConflictWarning(null);
        }
      })
      .finally(() => {
        setIsCheckingConflict(false);
      });
  }, [
    organization,
    selectedSessionId,
    selectedClassId,
    selectedSectionId,
    selectedTeacherId,
    selectedRoomId,
    selectedPeriodId,
    selectedDay,
  ]);

  const onFormSubmit = async (data: TimetableEntryInput) => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await createTimetableEntry(
        organization.id,
        data,
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );

      setSuccessMsg("Timetable entry scheduled successfully.");
      setTimeout(() => {
        navigate({ to: "/timetable/classes", search: { classId: data.classId, sectionId: data.sectionId } });
      }, 1000);
    } catch (err: any) {
      console.error("Create timetable error:", err);
      setError(err.message || "Unable to save timetable changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedPeriodObj = periodsList.find((p) => p.id === selectedPeriodId);
  const isNonRegularPeriod = selectedPeriodObj && selectedPeriodObj.type !== "Regular";

  const workingDays: DayOfWeek[] = settings?.workingDays || [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/timetable/classes">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Create Timetable Entry
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Schedule a subject, teacher, classroom, and period with automatic conflict validation.
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {conflictWarning && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-700 dark:text-amber-400">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Schedule Conflict Warning:</strong>
            <p className="mt-0.5">{conflictWarning}</p>
          </div>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onFormSubmit)} className="space-y-6">
        {/* Step 1: Academic & Classroom Target */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <GraduationCap className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Class & Academic Session
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic Session *</Label>
              <select
                {...form.register("academicSessionId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {sessionsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class Grade *</Label>
              <select
                {...form.register("classId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Section *</Label>
              <select
                {...form.register("sectionId")}
                disabled={sectionsList.length === 0}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                {sectionsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Step 2: Day & Period Timing */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Clock className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Day & School Period
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Day of the Week *</Label>
              <select
                {...form.register("dayOfWeek")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {workingDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Select Period *</Label>
              <select
                {...form.register("periodId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {periodsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.startTime} - {p.endTime}) {p.type !== "Regular" ? `[${p.type}]` : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isNonRegularPeriod && (
            <p className="text-xs text-amber-600 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
              Note: This is an assembly or break period. Academic subject assignments are normally not applicable.
            </p>
          )}
        </div>

        {/* Step 3: Subject, Teacher & Room Assignment */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <BookOpen className="size-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Subject, Teacher & Room Allocation
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject *</Label>
              <select
                {...form.register("subjectId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select Subject --</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
              {form.formState.errors.subjectId && (
                <p className="text-[11px] text-destructive">{form.formState.errors.subjectId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Teacher *</Label>
              <select
                {...form.register("teacherId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select Teacher --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.personal.fullName} ({t.employeeId})
                  </option>
                ))}
              </select>
              {form.formState.errors.teacherId && (
                <p className="text-[11px] text-destructive">{form.formState.errors.teacherId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Room / Lab (Optional)</Label>
              <select
                {...form.register("roomId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Default Classroom --</option>
                {roomsList
                  .filter((r) => r.status === "Available")
                  .map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} (#{r.roomNumber})
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/timetable/classes" })}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="hero"
            disabled={isSaving || !!conflictWarning}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            Save Timetable Entry
          </Button>
        </div>
      </form>
    </div>
  );
};
