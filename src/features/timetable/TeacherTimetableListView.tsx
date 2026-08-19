import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import {
  Users,
  Search,
  Clock,
  GraduationCap,
  Building2,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTeachers,
  getPeriods,
  getTeacherTimetable,
  getAcademicSettings,
  getTimetableSettings,
} from "@/services";
import type {
  Teacher,
  Period,
  TimetableEntry,
  DayOfWeek,
  AcademicSettingsConfig,
  TimetableSettingsConfig,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface TeacherTimetableSearch {
  teacherId?: string;
}

export const TeacherTimetableListView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const searchParams = (useSearch({ strict: false }) as TeacherTimetableSearch) || {};

  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [periodsList, setPeriodsList] = useState<Period[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsConfig | null>(null);
  const [academicSettings, setAcademicSettings] = useState<AcademicSettingsConfig | null>(null);

  const [selectedTeacherId, setSelectedTeacherId] = useState<string>(searchParams.teacherId || "");
  const [selectedDept, setSelectedDept] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>("Monday");

  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Teachers & Settings
  const loadInitialData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [teachers, periods, tSett, aSett] = await Promise.all([
        getTeachers(organization.id, "active"),
        getPeriods(organization.id),
        getTimetableSettings(organization.id),
        getAcademicSettings(organization.id),
      ]);
      setTeachersList(teachers);
      setPeriodsList(periods);
      setSettings(tSett);
      setAcademicSettings(aSett);

      if (teachers.length > 0 && !selectedTeacherId) {
        setSelectedTeacherId(teachers[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load teachers.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [organization, selectedSession]);

  // Load Teacher's Timetable
  const loadTeacherSchedule = useCallback(async () => {
    if (!organization || !selectedTeacherId) return;
    setIsLoadingSchedule(true);
    setError(null);
    try {
      const entries = await getTeacherTimetable(
        organization.id,
        selectedTeacherId,
        selectedSession?.id
      );
      setTimetableEntries(entries);
    } catch (err: any) {
      setError(err.message || "Unable to load teacher timetable.");
    } finally {
      setIsLoadingSchedule(false);
    }
  }, [organization, selectedTeacherId, selectedSession]);

  useEffect(() => {
    if (selectedTeacherId) {
      loadTeacherSchedule();
    }
  }, [selectedTeacherId, loadTeacherSchedule]);

  const selectedTeacher = teachersList.find((t) => t.id === selectedTeacherId);

  const workingDays: DayOfWeek[] = settings?.workingDays || [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  // Helper to find entry for a specific day and period
  const getEntry = (day: DayOfWeek, periodId: string) => {
    return timetableEntries.find((e) => e.dayOfWeek === day && e.periodId === periodId);
  };

  const filteredTeachers = teachersList.filter((t) => {
    const matchesSearch =
      t.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept =
      selectedDept === "all" || t.professional.department === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Teacher Timetables & Schedules
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Weekly teaching schedule, allocated classrooms, subjects, and period loads.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/timetable/create">
            <Clock className="size-3.5 mr-1" /> Add Schedule Entry
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Teacher Search & Selector Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search faculty by name, employee ID..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Departments</option>
            {academicSettings?.defaultDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          {/* Teacher Selector */}
          <select
            value={selectedTeacherId}
            onChange={(e) => setSelectedTeacherId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {filteredTeachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.personal.fullName} ({t.employeeId})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Teacher Summary Banner */}
      {selectedTeacher && (
        <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            {selectedTeacher.personal.photoUrl ? (
              <img
                src={selectedTeacher.personal.photoUrl}
                alt={selectedTeacher.personal.fullName}
                className="size-12 rounded-2xl object-cover shrink-0"
              />
            ) : (
              <div className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary font-black text-sm shrink-0">
                {selectedTeacher.personal.firstName.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-foreground">
                  {selectedTeacher.personal.fullName}
                </h2>
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-primary">
                  {selectedTeacher.employeeId}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {selectedTeacher.professional.designation} • {selectedTeacher.professional.department}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-border bg-surface px-4 py-2 text-center">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">Weekly Load</span>
              <p className="text-lg font-black text-primary">{timetableEntries.length} Periods</p>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Table */}
      {isLoadingSchedule ? (
        <div className="py-20 text-center text-muted-foreground rounded-3xl border border-border bg-card shadow-soft">
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
          <p className="mt-2 text-xs font-semibold">Loading teacher schedule...</p>
        </div>
      ) : periodsList.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground rounded-3xl border border-border bg-card shadow-soft">
          <Clock className="mx-auto size-8 opacity-40" />
          <p className="mt-2 text-xs font-semibold">No periods configured yet.</p>
        </div>
      ) : (
        <>
          {/* Desktop Schedule Grid */}
          <div className="hidden md:block rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border bg-surface/60">
                    <th className="p-4 font-bold text-muted-foreground uppercase text-[10px] w-28 shrink-0">
                      Period / Time
                    </th>
                    {workingDays.map((day) => (
                      <th
                        key={day}
                        className="p-4 font-extrabold text-foreground uppercase text-[11px] tracking-wider text-center border-l border-border"
                      >
                        {day}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {periodsList.map((period) => (
                    <tr key={period.id} className="hover:bg-surface/30 transition-colors">
                      <td className="p-4 bg-surface/30 font-bold border-r border-border">
                        <p className="font-extrabold text-foreground">{period.name}</p>
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                          {period.startTime} - {period.endTime}
                        </p>
                        {period.type !== "Regular" && (
                          <span className="mt-1 inline-block rounded-md bg-secondary px-1.5 py-0.5 text-[9px] font-black uppercase text-muted-foreground">
                            {period.type}
                          </span>
                        )}
                      </td>

                      {workingDays.map((day) => {
                        const entry = getEntry(day, period.id);

                        if (period.type !== "Regular") {
                          return (
                            <td
                              key={day}
                              className="p-3 text-center border-l border-border bg-secondary/20"
                            >
                              <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                {period.type}
                              </span>
                            </td>
                          );
                        }

                        return (
                          <td
                            key={day}
                            className="p-2 border-l border-border align-top h-24 min-w-[150px]"
                          >
                            {entry ? (
                              <div className="flex flex-col justify-between h-full rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs">
                                <div className="space-y-1">
                                  <p className="font-extrabold text-emerald-600 text-xs leading-tight">
                                    {entry.subjectName}
                                  </p>
                                  <p className="text-[10px] font-semibold text-foreground flex items-center gap-1">
                                    <GraduationCap className="size-3 text-muted-foreground" />
                                    {entry.className} ({entry.sectionName})
                                  </p>
                                  {entry.roomName && (
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Building2 className="size-3" />
                                      {entry.roomName}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/40 p-2 text-center">
                                <span className="text-[10px] font-bold text-muted-foreground/50">
                                  Free Period
                                </span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Schedule View */}
          <div className="block md:hidden space-y-4">
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              {workingDays.map((day) => (
                <button
                  key={day}
                  onClick={() => setSelectedMobileDay(day)}
                  className={`rounded-xl px-3 py-1.5 text-xs font-bold whitespace-nowrap transition-all ${
                    selectedMobileDay === day
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  {day.slice(0, 3)}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {periodsList.map((period) => {
                const entry = getEntry(selectedMobileDay, period.id);

                return (
                  <div
                    key={period.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="font-bold text-xs text-foreground">{period.name}</span>
                      <span className="text-[10px] font-mono text-muted-foreground">
                        {period.startTime} - {period.endTime}
                      </span>
                    </div>

                    {period.type !== "Regular" ? (
                      <p className="text-xs text-muted-foreground italic text-center py-1">
                        {period.type}
                      </p>
                    ) : entry ? (
                      <div className="space-y-1">
                        <p className="font-extrabold text-emerald-600 text-sm">{entry.subjectName}</p>
                        <p className="text-xs text-foreground flex items-center gap-1.5">
                          <GraduationCap className="size-3 text-muted-foreground" /> {entry.className} ({entry.sectionName})
                        </p>
                        {entry.roomName && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <Building2 className="size-3" /> {entry.roomName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">Free Period</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
