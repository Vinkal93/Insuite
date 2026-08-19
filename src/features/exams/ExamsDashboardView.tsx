import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Calendar,
  Layers,
  Edit3,
  Trophy,
  FileText,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { ExamDashboardStats, Exam, ExamSchedule } from "@/types/exams";
import {
  getExamDashboardStats,
  listExams,
  listExamSchedules,
} from "@/services/examService";
import { Button } from "@/components/ui/button";

export const ExamsDashboardView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [stats, setStats] = useState<ExamDashboardStats | null>(null);
  const [recentExams, setRecentExams] = useState<Exam[]>([]);
  const [upcomingSchedules, setUpcomingSchedules] = useState<ExamSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [s, exList, schList] = await Promise.all([
        getExamDashboardStats(organization.id, selectedSession?.id),
        listExams(organization.id, { sessionId: selectedSession?.id }),
        listExamSchedules(organization.id, { sessionId: selectedSession?.id }),
      ]);
      setStats(s);
      setRecentExams(exList.slice(0, 5));
      setUpcomingSchedules(schList.slice(0, 5));
    } catch (err: any) {
      console.error("ExamsDashboard load error:", err);
      setErrorMsg("Unable to load examination statistics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession]);

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="flex justify-between items-center">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
          <div className="h-9 w-32 animate-pulse rounded-xl bg-secondary" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-3xl bg-secondary/80 border border-border/50" />
          ))}
        </div>
      </div>
    );
  }

  if (errorMsg) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive my-8">
        <AlertCircle className="size-8 mb-2" />
        <h3 className="text-base font-bold">Unable to load examination information</h3>
        <p className="mt-1 text-xs text-muted-foreground">{errorMsg}</p>
        <Button onClick={loadData} variant="outline" size="sm" className="mt-4 rounded-xl text-xs font-semibold">
          <RefreshCw className="size-3.5 mr-1.5" /> Retry
        </Button>
      </div>
    );
  }

  const hasExams = stats && stats.totalExams > 0;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Examinations & Results Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Oversee examination sessions, timetable schedules, subject marks entry, and report card publishing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/exams/new">
              <Plus className="size-3.5 mr-1.5" /> Create Exam
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/exams/marks">
              <Edit3 className="size-3.5 mr-1.5" /> Marks Entry
            </Link>
          </Button>
        </div>
      </div>

      {!hasExams ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-4">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <GraduationCap className="size-7" />
          </div>
          <div className="space-y-1 max-w-sm mx-auto">
            <h3 className="text-base font-bold text-foreground">No examinations created yet</h3>
            <p className="text-xs text-muted-foreground">
              Define your first school examination (e.g. Unit Test, Mid-Term, or Annual Examination) to get started with marks entry and report cards.
            </p>
          </div>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/exams/new">
              <Plus className="size-3.5 mr-1.5" /> Create First Exam
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* 6-KPI Top Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Total Exams</span>
              <p className="text-xl font-black text-foreground">{stats?.totalExams}</p>
              <p className="text-[10px] text-muted-foreground">Active Session</p>
            </div>

            <div className="rounded-3xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-blue-600">Active Exams</span>
              <p className="text-xl font-black text-blue-600">{stats?.activeExamsCount}</p>
              <p className="text-[10px] text-blue-700/80">Ongoing or Scheduled</p>
            </div>

            <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-amber-600">Upcoming</span>
              <p className="text-xl font-black text-amber-600">{stats?.upcomingExamsCount}</p>
              <p className="text-[10px] text-amber-700/80">Pending Schedule</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-muted-foreground">Completed</span>
              <p className="text-xl font-black text-foreground">{stats?.completedExamsCount}</p>
              <p className="text-[10px] text-muted-foreground">Concluded Exams</p>
            </div>

            <div className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-purple-600">Marks Pending</span>
              <p className="text-xl font-black text-purple-600">{stats?.marksPendingCount}</p>
              <p className="text-[10px] text-purple-700/80">Awaiting Entry</p>
            </div>

            <div className="rounded-3xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-soft space-y-1">
              <span className="text-[10px] font-extrabold uppercase text-emerald-600">Results Live</span>
              <p className="text-xl font-black text-emerald-600">{stats?.resultsPublishedCount}</p>
              <p className="text-[10px] text-emerald-700/80">Published Results</p>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              to="/exams/schedule"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-500 group-hover:scale-110 transition-transform">
                  <Calendar className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Exam Schedule</h4>
                  <p className="text-[11px] text-muted-foreground">Time slots & rooms</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/exams/marks"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600 group-hover:scale-110 transition-transform">
                  <Edit3 className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Marks Entry</h4>
                  <p className="text-[11px] text-muted-foreground">Subject marksheets</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/exams/results"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600 group-hover:scale-110 transition-transform">
                  <Layers className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Result Processing</h4>
                  <p className="text-[11px] text-muted-foreground">Calculate & publish</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>

            <Link
              to="/exams/rankings"
              className="group flex items-center justify-between rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-purple-500/10 p-3 text-purple-600 group-hover:scale-110 transition-transform">
                  <Trophy className="size-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Class Rankings</h4>
                  <p className="text-[11px] text-muted-foreground">Grade leaderboards</p>
                </div>
              </div>
              <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </Link>
          </div>

          {/* Recent Exams & Upcoming Schedules Grid */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recent Exams */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Examination Sessions</h3>
                  <p className="text-xs text-muted-foreground">Created academic examinations</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                  <Link to="/exams/list">View All</Link>
                </Button>
              </div>

              {recentExams.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground italic">No exams recorded.</p>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {recentExams.map((ex) => (
                    <div key={ex.id} className="flex items-center justify-between py-3">
                      <div>
                        <Link to="/exams/$examId" params={{ examId: ex.id }} className="font-bold text-foreground hover:text-primary transition-colors">
                          {ex.name}
                        </Link>
                        <p className="text-[11px] text-muted-foreground">
                          {ex.type} • {ex.startDate} to {ex.endDate}
                        </p>
                      </div>
                      <span
                        className={`inline-block rounded-md px-2 py-0.5 text-[9px] font-bold ${
                          ex.status === "Published"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : ex.status === "Ongoing"
                            ? "bg-blue-500/10 text-blue-600"
                            : ex.status === "Result Processing"
                            ? "bg-purple-500/10 text-purple-600"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {ex.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Upcoming Schedules */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">Upcoming Examination Slots</h3>
                  <p className="text-xs text-muted-foreground">Scheduled time slots & rooms</p>
                </div>
                <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                  <Link to="/exams/schedule">Schedule Grid</Link>
                </Button>
              </div>

              {upcomingSchedules.length === 0 ? (
                <p className="py-6 text-center text-xs text-muted-foreground italic">No examination slots scheduled yet.</p>
              ) : (
                <div className="divide-y divide-border text-xs">
                  {upcomingSchedules.map((sch) => (
                    <div key={sch.id} className="flex items-center justify-between py-3">
                      <div>
                        <p className="font-bold text-foreground">
                          {sch.subjectName} ({sch.className})
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {sch.date} • {sch.startTime} - {sch.endTime} {sch.roomName ? `• Room: ${sch.roomName}` : ""}
                        </p>
                      </div>
                      <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        {sch.sectionName}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
