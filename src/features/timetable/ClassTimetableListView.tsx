import React, { useState, useEffect, useCallback } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Clock,
  User,
  Building2,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSchoolClasses,
  getSections,
  getPeriods,
  getClassTimetable,
  deleteTimetableEntry,
  getTimetableSettings,
  getAcademicSessionsList,
} from "@/services";
import type {
  SchoolClass,
  Section,
  Period,
  TimetableEntry,
  DayOfWeek,
  AcademicSessionItem,
  TimetableSettingsConfig,
} from "@/types";
import { Button } from "@/components/ui/button";

interface ClassTimetableSearch {
  classId?: string;
  sectionId?: string;
}

export const ClassTimetableListView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const searchParams = (useSearch({ strict: false }) as ClassTimetableSearch) || {};

  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [periodsList, setPeriodsList] = useState<Period[]>([]);
  const [settings, setSettings] = useState<TimetableSettingsConfig | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string>(searchParams.classId || "");
  const [selectedSectionId, setSelectedSectionId] = useState<string>(searchParams.sectionId || "");
  const [selectedMobileDay, setSelectedMobileDay] = useState<DayOfWeek>("Monday");

  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  // Load Classes, Periods & Settings
  useEffect(() => {
    if (!organization) return;
    Promise.all([
      getSchoolClasses(organization.id, selectedSession?.id),
      getPeriods(organization.id),
      getTimetableSettings(organization.id),
    ]).then(([classes, periods, sett]) => {
      setClassesList(classes);
      setPeriodsList(periods);
      setSettings(sett);
      if (classes.length > 0 && !selectedClassId) {
        setSelectedClassId(classes[0].id);
      }
    });
  }, [organization, selectedSession]);

  // Load Sections when Class changes
  useEffect(() => {
    if (!organization || !selectedClassId) return;
    getSections(organization.id, selectedClassId, selectedSession?.id).then((secs) => {
      setSectionsList(secs);
      if (secs.length > 0) {
        setSelectedSectionId(secs[0].id);
      } else {
        setSelectedSectionId("");
        setTimetableEntries([]);
      }
    });
  }, [organization, selectedClassId, selectedSession]);

  // Load Class Timetable
  const loadTimetable = useCallback(async () => {
    if (!organization || !selectedClassId || !selectedSectionId) return;
    setIsLoading(true);
    setError(null);
    try {
      const entries = await getClassTimetable(
        organization.id,
        selectedClassId,
        selectedSectionId,
        selectedSession?.id
      );
      setTimetableEntries(entries);
    } catch (err: any) {
      setError(err.message || "Unable to load timetable records.");
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedClassId, selectedSectionId, selectedSession]);

  useEffect(() => {
    if (selectedSectionId) {
      loadTimetable();
    }
  }, [selectedSectionId, loadTimetable]);

  const handleDeleteEntry = async (entry: TimetableEntry) => {
    if (!organization || !firebaseUser) return;
    if (
      !confirm(
        `Delete timetable entry for ${entry.subjectName} (${entry.dayOfWeek}, ${entry.periodName})?`
      )
    ) {
      return;
    }

    setIsDeletingId(entry.id);
    setError(null);
    setSuccessMsg(null);
    try {
      await deleteTimetableEntry(
        organization.id,
        entry.id,
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );
      setSuccessMsg(`Timetable entry for ${entry.subjectName} deleted.`);
      await loadTimetable();
    } catch (err: any) {
      setError(err.message || "Unable to delete timetable entry.");
    } finally {
      setIsDeletingId(null);
    }
  };

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

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Class Timetables
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Weekly classroom schedule grid with period timings, assigned teachers, and rooms.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/timetable/create">
              <Plus className="size-3.5 mr-1" /> Add Timetable Entry
            </Link>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadTimetable}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Class & Section Selector Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="grid gap-4 sm:grid-cols-2 max-w-xl">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Select Class *</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
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
            <label className="text-xs font-semibold">Select Section *</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
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

      {/* Main Timetable Content */}
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground rounded-3xl border border-border bg-card shadow-soft">
          <Loader2 className="mx-auto size-6 animate-spin text-primary" />
          <p className="mt-2 text-xs font-semibold">Loading class timetable...</p>
        </div>
      ) : periodsList.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground rounded-3xl border border-border bg-card shadow-soft">
          <Clock className="mx-auto size-8 opacity-40" />
          <p className="mt-2 text-xs font-semibold">No school periods configured yet.</p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/timetable/periods">+ Configure School Periods</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop & Tablet Matrix Grid (Hidden on small mobile) */}
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
                      {/* Period Header Column */}
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

                      {/* Day Columns */}
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
                              <div className="group relative flex flex-col justify-between h-full rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs transition-all hover:bg-primary/10 hover:shadow-soft">
                                <div className="space-y-1">
                                  <p className="font-extrabold text-primary text-xs leading-tight">
                                    {entry.subjectName}
                                  </p>
                                  <p className="text-[10px] font-medium text-foreground flex items-center gap-1">
                                    <User className="size-3 text-muted-foreground" />
                                    {entry.teacherName}
                                  </p>
                                  {entry.roomName && (
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                      <Building2 className="size-3" />
                                      {entry.roomName}
                                    </p>
                                  )}
                                </div>

                                <div className="mt-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    disabled={isDeletingId === entry.id}
                                    onClick={() => handleDeleteEntry(entry)}
                                    className="size-6 rounded-lg text-rose-500 hover:bg-rose-500/10"
                                  >
                                    <Trash2 className="size-3" />
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-border/60 p-2 text-center">
                                <Link
                                  to="/timetable/create"
                                  className="text-[10px] font-bold text-muted-foreground hover:text-primary transition-colors"
                                >
                                  + Assign
                                </Link>
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

          {/* Mobile View: Day Selector Tabs + Vertical Period Cards */}
          <div className="block md:hidden space-y-4">
            {/* Mobile Day Tabs */}
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

            {/* Period Cards */}
            <div className="space-y-3">
              {periodsList.map((period) => {
                const entry = getEntry(selectedMobileDay, period.id);

                return (
                  <div
                    key={period.id}
                    className="rounded-2xl border border-border bg-card p-4 shadow-soft space-y-2"
                  >
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-foreground">{period.name}</span>
                        <span className="text-[10px] font-mono text-muted-foreground">
                          {period.startTime} - {period.endTime}
                        </span>
                      </div>
                      {period.type !== "Regular" && (
                        <span className="rounded-md bg-secondary px-2 py-0.5 text-[9px] font-black uppercase text-muted-foreground">
                          {period.type}
                        </span>
                      )}
                    </div>

                    {period.type !== "Regular" ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">
                        {period.type} Break
                      </p>
                    ) : entry ? (
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-extrabold text-primary text-sm">{entry.subjectName}</p>
                          <p className="text-xs text-foreground flex items-center gap-1.5">
                            <User className="size-3 text-muted-foreground" /> {entry.teacherName}
                          </p>
                          {entry.roomName && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                              <Building2 className="size-3" /> {entry.roomName}
                            </p>
                          )}
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteEntry(entry)}
                          className="size-8 rounded-xl text-rose-500 hover:bg-rose-500/10"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-muted-foreground">No subject assigned</span>
                        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-bold">
                          <Link to="/timetable/create">+ Assign</Link>
                        </Button>
                      </div>
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
