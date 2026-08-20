import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  PenTool,
  Users,
  CalendarCheck,
  BookOpen,
  FileCheck,
  Trophy,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getTeacherTimetable } from "@/services/timetableService";
import { getAssignments } from "@/services/academicWorkService";
import { listExams } from "@/services/examService";
import { listAnnouncements } from "@/services/communicationService";
import { Button } from "@/components/ui/button";

export const TeacherDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const { teacher, allocations, isLoading: isTeacherLoading } = useTeacher();

  const [todayPeriods, setTodayPeriods] = useState<any[]>([]);
  const [activeAssignments, setActiveAssignments] = useState<any[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization || !teacher) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDay = dayNames[new Date().getDay()] || "Monday";

      const [schedule, assignRes, examsList, noticeList] = await Promise.all([
        getTeacherTimetable(organization.id, teacher.id).catch(() => []),
        getAssignments(organization.id, { status: "PUBLISHED" }).catch(() => ({ assignments: [] })),
        listExams(organization.id, { status: "ACTIVE" }).catch(() => []),
        listAnnouncements(organization.id, { targetAudience: "STAFF" }).catch(() => []),
      ]);

      setTodayPeriods(schedule.filter((s) => s.dayOfWeek === currentDay));
      setAssignments(assignRes?.assignments || []);
      setUpcomingExams(examsList);
      setNotices(noticeList.slice(0, 3));
    } catch (err: any) {
      console.error("loadTeacherDashboard error:", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  const setAssignments = (items: any[]) => setActiveAssignments(items);

  useEffect(() => {
    loadDashboard();
  }, [organization, teacher]);

  if (isTeacherLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <PenTool className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">Teacher Profile Not Linked</h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Your login credentials are not currently associated with an active faculty staff profile.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
            {teacher.photoUrl ? (
              <img src={teacher.photoUrl} alt={teacher.fullName} className="w-full h-full object-cover" />
            ) : (
              teacher.fullName.charAt(0)
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Teacher Workspace
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">{teacher.fullName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              {teacher.designation || "Faculty"} • Employee ID:{" "}
              <span className="font-mono font-bold text-primary">{teacher.employeeId}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <Link
            to="/teacher/attendance"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <CalendarCheck className="size-3.5" /> Take Attendance
          </Link>
          <Link
            to="/teacher/assignments/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-card border border-border hover:border-primary text-xs font-bold text-foreground transition-colors"
          >
            <Plus className="size-3.5" /> Assignment
          </Link>
        </div>
      </div>

      {/* 4 Summary Telemetry Widgets */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Classes Allocated */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">My Classes</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{allocations.classes.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {allocations.subjects.length} subject assignments
            </p>
          </div>
          <Link
            to="/teacher/classes"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Class Roster →
          </Link>
        </div>

        {/* Today's Lectures */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Today's Lectures</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{todayPeriods.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Periods scheduled</p>
          </div>
          <Link
            to="/teacher/timetable"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            My Timetable →
          </Link>
        </div>

        {/* Active Homework */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Active Tasks</span>
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{activeAssignments.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Published assignments</p>
          </div>
          <Link
            to="/teacher/assignments"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            View Homework →
          </Link>
        </div>

        {/* Upcoming Exams */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Assessments</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Trophy className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{upcomingExams.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active exam sessions</p>
          </div>
          <Link
            to="/teacher/exams"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Marks Entry →
          </Link>
        </div>
      </div>

      {/* Two Column Workspace: Today's Schedule & Faculty Circulars */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Teaching Schedule */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Today's Class Schedule</h3>
                <p className="text-[10px] text-muted-foreground">Classroom & period allocations</p>
              </div>
            </div>
            <Link to="/teacher/timetable" className="text-xs font-bold text-primary hover:underline">
              Full Week →
            </Link>
          </div>

          {todayPeriods.length === 0 ? (
            <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No classes scheduled for today.
            </div>
          ) : (
            <div className="space-y-2">
              {todayPeriods.map((p, i) => (
                <div
                  key={i}
                  className="p-3 rounded-2xl bg-surface/50 border border-border flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-foreground">{p.subjectName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                        Class {p.className} - {p.sectionName}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {p.roomNumber ? `Room ${p.roomNumber}` : "Main Classroom"}
                    </p>
                  </div>
                  <span className="font-mono font-bold text-foreground">
                    {p.startTime} - {p.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Circulars */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <PenTool className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Staff Notices</h3>
                <p className="text-[10px] text-muted-foreground">Faculty administrative broadcasts</p>
              </div>
            </div>
            <Link to="/teacher/notices" className="text-xs font-bold text-primary hover:underline">
              All Notices →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No new faculty notices posted.
            </div>
          ) : (
            <div className="space-y-2">
              {notices.map((n) => (
                <div
                  key={n.id}
                  className="p-3 rounded-2xl bg-surface/50 border border-border space-y-1 text-xs"
                >
                  <h4 className="font-bold text-foreground line-clamp-1">{n.title}</h4>
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {n.createdAt?.split("T")[0]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
