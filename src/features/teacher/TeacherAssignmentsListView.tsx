import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Plus,
  Clock,
  FileCheck,
  AlertCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getAssignments } from "@/services/academicWorkService";
import type { Assignment } from "@/types/academicWork";
import { Button } from "@/components/ui/button";

export const TeacherAssignmentsListView: React.FC = () => {
  const { organization } = useAuth();
  const { teacher } = useTeacher();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAssignments = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await getAssignments(organization.id, {});
      setAssignments(res.assignments || []);
    } catch (err: any) {
      console.error("loadTeacherAssignments error:", err);
      setError(err.message || "Failed to load assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Assignments & Coursework
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage subject homework, project instructions, and student submission deadlines.
          </p>
        </div>

        <Link
          to="/teacher/assignments/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Create Assignment
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadAssignments} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <BookOpen className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No assignments created</h3>
          <p className="mt-1 text-xs text-muted-foreground">Click "Create Assignment" to assign work.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-primary uppercase">{a.subjectName}</span>
                    <h3 className="font-extrabold text-sm text-foreground">{a.title}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      a.status === "PUBLISHED"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : a.status === "DRAFT"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                {a.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Due: {a.dueDate} • Max: {a.totalMarks} Marks
                </span>

                <Link
                  to={`/teacher/submissions/${a.id}`}
                  className="font-bold text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  <FileCheck className="size-3.5" /> Review Submissions →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
