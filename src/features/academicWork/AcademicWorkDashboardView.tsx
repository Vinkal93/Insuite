import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  FileText,
  Layers,
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Plus,
  ArrowRight,
  TrendingUp,
  GraduationCap,
  Calendar,
  Loader2,
  RefreshCw,
  FolderKanban,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getAcademicWorkStats, getAssignments } from "@/services";
import type { AcademicWorkStats, Assignment } from "@/types";
import { Button } from "@/components/ui/button";

export const AcademicWorkDashboardView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [stats, setStats] = useState<AcademicWorkStats | null>(null);
  const [recentAssignments, setRecentAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [st, assignments] = await Promise.all([
        getAcademicWorkStats(organization.id, selectedSession?.id),
        getAssignments(organization.id, {
          academicSessionId: selectedSession?.id,
        }),
      ]);
      setStats(st);
      setRecentAssignments(assignments.slice(0, 5));
    } catch (err: any) {
      console.error("Academic work dashboard error:", err);
      setError(err.message || "Unable to load academic work information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession]);

  return (
    <div className="space-y-8 pb-16">
      {/* Header & Quick Action Buttons */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Academic Work
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Create, distribute and evaluate assignments, homework, and classwork across grades.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academic-work/assignments/new" search={{ type: "Homework" }}>
              <Plus className="size-3.5 mr-1 text-primary" /> + Homework
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academic-work/assignments/new" search={{ type: "Classwork" }}>
              <Plus className="size-3.5 mr-1 text-blue-500" /> + Classwork
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/academic-work/assignments/new">
              <Plus className="size-3.5 mr-1" /> Create Assignment
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

      {/* KPI Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Active Assignments */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Active Assignments
            </span>
            <div className="rounded-xl bg-primary/10 p-2 text-primary">
              <FileText className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-black tracking-tight text-foreground">
                {stats?.activeAssignments ?? 0}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Published and open for submission</p>
          </div>
        </div>

        {/* Needs Grading */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-amber-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Needs Grading
            </span>
            <div className="rounded-xl bg-amber-500/10 p-2 text-amber-500">
              <CheckCircle2 className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-black tracking-tight text-amber-500">
                {stats?.needsGrading ?? 0}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Submissions awaiting evaluation</p>
          </div>
        </div>

        {/* Overdue Work */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Overdue Work
            </span>
            <div className="rounded-xl bg-rose-500/10 p-2 text-rose-500">
              <Clock className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-black tracking-tight text-rose-500">
                {stats?.overdueWork ?? 0}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Past deadline submission cutoff</p>
          </div>
        </div>

        {/* Completed Work */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Completed Work
            </span>
            <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600">
              <ClipboardCheck className="size-4" />
            </div>
          </div>
          <div className="mt-3">
            {isLoading ? (
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            ) : (
              <p className="text-2xl font-black tracking-tight text-emerald-600">
                {stats?.completedWork ?? 0}
              </p>
            )}
            <p className="mt-1 text-[11px] text-muted-foreground">Evaluated and archived tasks</p>
          </div>
        </div>
      </div>

      {/* Module Navigation Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link
          to="/academic-work/homework"
          className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <BookOpen className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Homework Hub</h3>
              <p className="text-[11px] text-muted-foreground">Daily subject assignments</p>
            </div>
          </div>
        </Link>

        <Link
          to="/academic-work/classwork"
          className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-blue-500"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-blue-500/10 p-2.5 text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <Layers className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Classwork</h3>
              <p className="text-[11px] text-muted-foreground">In-class exercises & labs</p>
            </div>
          </div>
        </Link>

        <Link
          to="/academic-work/grading"
          className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-amber-500"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-2.5 text-amber-500 group-hover:bg-amber-500 group-hover:text-white transition-colors">
              <CheckCircle2 className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Grading Desk</h3>
              <p className="text-[11px] text-muted-foreground">Evaluate & award marks</p>
            </div>
          </div>
        </Link>

        <Link
          to="/academic-work/resources"
          className="group rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:-translate-y-0.5 hover:border-emerald-500"
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-2.5 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <FolderKanban className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Resource Library</h3>
              <p className="text-[11px] text-muted-foreground">Worksheets & lecture notes</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Assignments Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Recent Academic Tasks</h2>
            <p className="text-xs text-muted-foreground">Latest homework, assignments, and worksheets</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academic-work/assignments">
              View All <ArrowRight className="size-3.5 ml-1" />
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading academic tasks...</p>
          </div>
        ) : recentAssignments.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No assignments created yet.</p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mt-4 rounded-xl text-xs"
            >
              <Link to="/academic-work/assignments/new">+ Create First Assignment</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Assignment Title</th>
                  <th className="px-4 py-3.5 font-bold">Type</th>
                  <th className="px-4 py-3.5 font-bold">Class & Subject</th>
                  <th className="px-4 py-3.5 font-bold">Due Date</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {recentAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                      <Link
                        to="/academic-work/assignments/$assignmentId"
                        params={{ assignmentId: a.id }}
                        className="hover:underline text-foreground hover:text-primary font-bold"
                      >
                        {a.title}
                      </Link>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold">
                        {a.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      <span className="font-semibold">{a.className} ({a.sectionName})</span>
                      <span className="text-muted-foreground ml-1.5 font-normal">— {a.subjectName}</span>
                    </td>
                    <td className="px-4 py-4 font-mono font-medium text-foreground">
                      {a.dueDate}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          a.status === "published"
                            ? "bg-success/15 text-success"
                            : a.status === "draft"
                            ? "bg-secondary text-muted-foreground"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
                        <Link
                          to="/academic-work/assignments/$assignmentId"
                          params={{ assignmentId: a.id }}
                        >
                          View
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
