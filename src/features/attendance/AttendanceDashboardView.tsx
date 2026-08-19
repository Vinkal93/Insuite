import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Users,
  UserCheck,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  GraduationCap,
  Layers,
  FileSpreadsheet,
  Settings,
  Plus,
  Loader2,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAttendanceDashboardStats,
  getSchoolClasses,
  getSections,
  getStudentAttendanceForDate,
} from "@/services";
import type { AttendanceDashboardStats, SchoolClass, Section } from "@/types";
import { Button } from "@/components/ui/button";

export const AttendanceDashboardView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [stats, setStats] = useState<AttendanceDashboardStats | null>(null);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [dashStats, classes] = await Promise.all([
        getAttendanceDashboardStats(organization.id, selectedDate, selectedSession?.id),
        getSchoolClasses(organization.id, selectedSession?.id),
      ]);
      setStats(dashStats);
      setClassesList(classes);
    } catch (err: any) {
      setError(err.message || "Failed to load attendance dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedDate, selectedSession]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
              Attendance
            </h1>
            <span className="rounded-md bg-card border border-border px-2.5 py-0.5 text-xs font-bold text-primary">
              {selectedDate}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Monitor student and staff attendance across your school.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/attendance/reports">
              <FileSpreadsheet className="size-3.5 mr-1.5" /> View Reports
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/attendance/students/take">
              <ClipboardCheck className="size-3.5 mr-1.5" /> Take Attendance
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {/* Attendance Rate */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Overall Rate
            </span>
            <TrendingUp className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">
            {isLoading ? "—" : `${stats?.attendancePercentage || 0}%`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Student Attendance</p>
        </div>

        {/* Present */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              Present
            </span>
            <CheckCircle2 className="size-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">
            {isLoading ? "—" : stats?.presentStudents || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Students Marked In</p>
        </div>

        {/* Absent */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
              Absent
            </span>
            <XCircle className="size-4 text-rose-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-rose-500">
            {isLoading ? "—" : stats?.absentStudents || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Unexcused Absences</p>
        </div>

        {/* Late */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
              Late
            </span>
            <Clock className="size-4 text-amber-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-amber-500">
            {isLoading ? "—" : stats?.lateStudents || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Late Arrivals</p>
        </div>

        {/* Leave */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500">
              On Leave
            </span>
            <CalendarDays className="size-4 text-blue-500" />
          </div>
          <p className="mt-2 text-2xl font-black text-blue-500">
            {isLoading ? "—" : stats?.leaveStudents || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Approved Leaves</p>
        </div>

        {/* Not Marked */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Pending
            </span>
            <AlertCircle className="size-4 text-muted-foreground" />
          </div>
          <p className="mt-2 text-2xl font-black text-muted-foreground">
            {isLoading ? "—" : stats?.notMarkedStudents || 0}
          </p>
          <p className="text-[10px] text-muted-foreground mt-1">Not Marked Yet</p>
        </div>
      </div>

      {/* Staff Attendance & Quick Action Hub */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Staff Attendance Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <UserCheck className="size-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Staff Attendance
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/attendance/staff/take">Mark Staff →</Link>
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-border bg-surface p-3">
              <span className="text-[10px] font-bold uppercase text-emerald-600">Present</span>
              <p className="mt-1 text-xl font-black text-foreground">{stats?.presentStaff || 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-3">
              <span className="text-[10px] font-bold uppercase text-rose-500">Absent</span>
              <p className="mt-1 text-xl font-black text-foreground">{stats?.absentStaff || 0}</p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-3">
              <span className="text-[10px] font-bold uppercase text-blue-500">Leave</span>
              <p className="mt-1 text-xl font-black text-foreground">{stats?.leaveStaff || 0}</p>
            </div>
          </div>

          <div className="pt-2 text-xs text-muted-foreground flex items-center justify-between">
            <span>Total Faculty: {stats?.totalStaff || 0}</span>
            <Link to="/attendance/staff" className="font-bold text-primary hover:underline">
              View Staff Table
            </Link>
          </div>
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-border">
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-amber-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Leave Requests
              </h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/attendance/leave">Manage →</Link>
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 text-center">
            <p className="text-3xl font-black text-amber-500">{stats?.pendingLeaveRequests || 0}</p>
            <p className="text-xs font-semibold text-muted-foreground mt-1">Pending Review</p>
          </div>

          <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold">
            <Link to="/attendance/leave">
              Review Leave Applications
            </Link>
          </Button>
        </div>

        {/* Quick Operations Links */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
            Quick Operations
          </h2>
          <div className="grid gap-2">
            <Button variant="outline" size="sm" asChild className="justify-start rounded-xl text-xs font-semibold">
              <Link to="/attendance/students/take">
                <ClipboardCheck className="size-3.5 mr-2 text-primary" /> Mark Student Attendance
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start rounded-xl text-xs font-semibold">
              <Link to="/attendance/staff/take">
                <UserCheck className="size-3.5 mr-2 text-emerald-500" /> Mark Faculty Attendance
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start rounded-xl text-xs font-semibold">
              <Link to="/attendance/reports">
                <FileSpreadsheet className="size-3.5 mr-2 text-blue-500" /> Generate Monthly Reports
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="justify-start rounded-xl text-xs font-semibold">
              <Link to="/attendance/settings">
                <Settings className="size-3.5 mr-2 text-muted-foreground" /> Attendance Policies & Thresholds
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Class-by-Class Attendance Table */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Grade & Classroom Attendance Dispatch
            </h2>
            <p className="text-[11px] text-muted-foreground">
              Select any class grade level to take or review classroom roll calls for {selectedDate}.
            </p>
          </div>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/attendance/students/take">
              <Plus className="size-3.5 mr-1" /> Mark Class
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
                      {cls.sectionsCount || 1} Sections • {cls.studentsCount || 0} Students
                    </p>
                  </div>
                </div>

                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-bold">
                  <Link to="/attendance/students/take">
                    Mark →
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
