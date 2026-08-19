import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarRange,
  Clock,
  Users,
  Building2,
  GraduationCap,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowRight,
  UserCheck,
  Calendar,
  SlidersHorizontal,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTimetableDashboardStats,
  getSchoolClasses,
} from "@/services";
import type { TimetableStats, SchoolClass } from "@/types";
import { Button } from "@/components/ui/button";

export const TimetableDashboardView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [stats, setStats] = useState<TimetableStats | null>(null);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [dashStats, classes] = await Promise.all([
        getTimetableDashboardStats(organization.id, selectedSession?.id),
        getSchoolClasses(organization.id, selectedSession?.id),
      ]);
      setStats(dashStats);
      setClassesList(classes);
    } catch (err: any) {
      setError(err.message || "Unable to load timetable dashboard information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Timetable & Scheduling
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage classroom schedules, teacher allocations, periods, and staff substitutions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/timetable/periods">
              <Clock className="size-3.5 mr-1.5" /> Manage Periods
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/timetable/create">
              <Plus className="size-3.5 mr-1" /> Create Timetable
            </Link>
          </Button>
        </div>
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
            onClick={loadData}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Scheduled Classes
            </span>
            <GraduationCap className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {isLoading ? "—" : stats?.totalScheduledClasses || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Active class timetables</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Today's Periods
            </span>
            <Clock className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {isLoading ? "—" : stats?.todaysPeriods || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Scheduled sessions today</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
              Free Teachers
            </span>
            <Users className="size-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-500">
            {isLoading ? "—" : stats?.freeTeachers || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Available faculty</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Free Rooms
            </span>
            <Building2 className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-500">
            {isLoading ? "—" : stats?.freeRooms || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Available classrooms/labs</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
              Substitutions
            </span>
            <UserCheck className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-500">
            {isLoading ? "—" : stats?.pendingSubstitutions || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Pending substitute assignments</p>
        </div>
      </div>

      {/* Quick Navigation Hub */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Class Timetables */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <GraduationCap className="size-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Class Timetables
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/timetable/classes">View All →</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            View weekly grids of scheduled periods, subjects, assigned faculty, and designated room locations for every grade and section.
          </p>
          <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold">
            <Link to="/timetable/classes">
              Explore Class Timetables
            </Link>
          </Button>
        </div>

        {/* Teacher Schedules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="size-4 text-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Teacher Schedules
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/timetable/teachers">View All →</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Track individual faculty weekly period load, daily classroom assignments, and identify unassigned free periods for substitution planning.
          </p>
          <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold">
            <Link to="/timetable/teachers">
              Explore Teacher Schedules
            </Link>
          </Button>
        </div>

        {/* Room & Facility Allocation */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Room Management
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/timetable/rooms">Manage →</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Manage classrooms, science and computer laboratories, libraries, and auditoriums with live occupancy and double-booking prevention.
          </p>
          <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold">
            <Link to="/timetable/rooms">
              Manage Rooms & Labs
            </Link>
          </Button>
        </div>
      </div>

      {/* Class Schedule Directory */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Class Grade Levels
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Select any class to inspect or generate its weekly schedule matrix.
            </p>
          </div>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/timetable/create">
              <Plus className="size-3.5 mr-1" /> Add Timetable Entry
            </Link>
          </Button>
        </div>

        {classesList.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <GraduationCap className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No classes configured yet.</p>
            <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
              <Link to="/academics/classes/new">+ Create Class in Academics</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classesList.map((cls) => (
              <div
                key={cls.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:bg-secondary hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary font-black text-xs shrink-0">
                    {cls.code}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{cls.name}</p>
                    <p className="text-[10px] text-muted-foreground font-medium">
                      {cls.sectionsCount || 1} Sections
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-bold">
                  <Link to="/timetable/classes" search={{ classId: cls.id }}>
                    View Schedule →
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
