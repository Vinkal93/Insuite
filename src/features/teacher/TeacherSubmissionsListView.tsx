import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileCheck,
  BookOpen,
  Users,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getAssignments } from "@/services/academicWorkService";
import type { Assignment } from "@/types/academicWork";
import { Button } from "@/components/ui/button";

export const TeacherSubmissionsListView: React.FC = () => {
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
      console.error("loadSubmissionsAssignments error:", err);
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
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Student Submissions & Evaluation
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Select an assignment to review uploaded student work, assign marks, and return feedback.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
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
          <FileCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No assignments to evaluate</h3>
          <p className="mt-1 text-xs text-muted-foreground">Create assignments to collect student submissions.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-3xl border border-border bg-card shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-primary/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground">{a.title}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                    Class {a.className} ({a.sectionName})
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Subject: {a.subjectName} • Due: {a.dueDate} • Max Marks: {a.totalMarks}
                </p>
              </div>

              <Link
                to={`/teacher/submissions/${a.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold text-primary shadow-sm transition-colors self-start sm:self-center"
              >
                <FileCheck className="size-3.5" /> Review Submissions <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
