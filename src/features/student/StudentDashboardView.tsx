import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  CalendarCheck,
  Clock,
  BookOpen,
  Trophy,
  BookMarked,
  Bus,
  Megaphone,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { getStudentAttendanceSummary } from "@/services/attendanceService";
import { getAssignments } from "@/services/academicWorkService";
import { listResults } from "@/services/examService";
import { getClassTimetable } from "@/services/timetableService";
import { listTransactions } from "@/services/libraryService";
import { listAnnouncements } from "@/services/communicationService";
import { Button } from "@/components/ui/button";

export const StudentDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const { student, isLoading: isStudentLoading } = useStudent();

  const [attendance, setAttendance] = useState<any | null>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [todayPeriods, setTodayPeriods] = useState<any[]>([]);
  const [issuedBooksCount, setIssuedBooksCount] = useState<number>(0);
  const [notices, setNotices] = useState<any[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sessionId = student.academic.sessionId || "";
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const currentDay = dayNames[new Date().getDay()] || "Monday";

      const [att, assignRes, resList, timeList, libTxns, noticeList] = await Promise.all([
        getStudentAttendanceSummary(organization.id, student.id, sessionId).catch(() => null),
        getAssignments(organization.id, {
          sessionId,
          classId: student.academic.classId,
          status: "PUBLISHED",
        }).catch(() => ({ assignments: [] })),
        listResults(organization.id, {
          studentId: student.id,
          status: "PUBLISHED",
        }).catch(() => []),
        getClassTimetable(organization.id, student.academic.classId, student.academic.sectionId).catch(() => []),
        listTransactions(organization.id, { memberId: student.id, status: "ISSUED" }).catch(() => []),
        listAnnouncements(organization.id, { targetAudience: "STUDENTS" }).catch(() => []),
      ]);

      setAttendance(att);
      setAssignments(assignRes?.assignments || []);
      setLatestResult(resList.length > 0 ? resList[0] : null);
      setTodayPeriods(timeList.filter((t) => t.dayOfWeek === currentDay));
      setIssuedBooksCount(libTxns.length);
      setNotices(noticeList.slice(0, 3));
    } catch (err: any) {
      console.error("loadStudentDashboard error:", err);
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization, student]);

  if (isStudentLoading) {
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

  if (!student) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <GraduationCap className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">Student Profile Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          Your login credentials are not currently linked to an active student admission record.
        </p>
      </div>
    );
  }

  // Attention Items
  const attentionItems: { label: string; route: string }[] = [];
  if (assignments.length > 0) {
    attentionItems.push({
      label: `You have ${assignments.length} active coursework assignment(s)`,
      route: "/student/homework",
    });
  }
  if (issuedBooksCount > 0) {
    attentionItems.push({
      label: `${issuedBooksCount} library book(s) currently issued to your account`,
      route: "/student/library",
    });
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center overflow-hidden border border-primary/20 shrink-0">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              student.firstName.charAt(0)
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Student Dashboard
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">{student.fullName}</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Class <span className="font-bold text-foreground">{student.academic.className}</span> (
              {student.academic.sectionName}) • Admission #:{" "}
              <span className="font-mono font-bold text-primary">{student.admissionNumber}</span>
            </p>
          </div>
        </div>

        <Link
          to="/student/profile"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border hover:border-primary text-xs font-bold text-foreground shadow-sm transition-colors self-start sm:self-auto"
        >
          My Profile <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Attention Alerts */}
      {attentionItems.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-soft space-y-2">
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs">
            <AlertTriangle className="size-4" />
            <span>Reminders & Actions</span>
          </div>
          <div className="space-y-1.5">
            {attentionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-card/80 p-2.5 rounded-xl border border-border text-xs"
              >
                <span className="font-semibold text-foreground">{item.label}</span>
                <Link to={item.route} className="font-bold text-primary hover:underline text-[11px]">
                  View →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Core Widgets */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {/* Attendance */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Attendance</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {attendance ? `${attendance.percentage}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {attendance ? `${attendance.presentDays} days present` : "No logs"}
            </p>
          </div>
          <Link
            to="/student/attendance"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Monthly Calendar →
          </Link>
        </div>

        {/* Homework */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Homework</span>
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{assignments.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active tasks</p>
          </div>
          <Link
            to="/student/homework"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Submit Homework →
          </Link>
        </div>

        {/* Latest Result */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Latest Exam</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Trophy className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {latestResult ? `${latestResult.percentage}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {latestResult ? `Grade: ${latestResult.grade}` : "No published marks"}
            </p>
          </div>
          <Link
            to="/student/exams"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Report Cards →
          </Link>
        </div>

        {/* Library */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Library Books</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <BookMarked className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{issuedBooksCount}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Books issued</p>
          </div>
          <Link
            to="/student/library"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            My Books →
          </Link>
        </div>
      </div>

      {/* Two Column Section: Today's Timetable & School Notices */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Clock className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Today's Class Schedule</h3>
                <p className="text-[10px] text-muted-foreground">Periods & classroom allocations</p>
              </div>
            </div>
            <Link to="/student/timetable" className="text-xs font-bold text-primary hover:underline">
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
                    <span className="font-bold text-foreground">{p.subjectName}</span>
                    <p className="text-[10px] text-muted-foreground">
                      {p.teacherName || "Subject Teacher"} {p.roomNumber ? `• Room ${p.roomNumber}` : ""}
                    </p>
                  </div>
                  <span className="font-mono font-semibold text-primary">
                    {p.startTime} - {p.endTime}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Circulars / Announcements */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Megaphone className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Student Circulars</h3>
                <p className="text-[10px] text-muted-foreground">School events & notifications</p>
              </div>
            </div>
            <Link to="/student/notices" className="text-xs font-bold text-primary hover:underline">
              All Notices →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No new circulars posted for students.
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
