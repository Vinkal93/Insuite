import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import { getAssignments } from "@/services/academicWorkService";
import type { Assignment } from "@/types/academicWork";
import { Button } from "@/components/ui/button";

export const ParentHomeworkListView: React.FC = () => {
  const { organization } = useAuth();
  const { selectedChild, children: kids } = useParent();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomework = async () => {
    if (!organization || !selectedChild) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await getAssignments(organization.id, {
        sessionId: selectedChild.academic.sessionId,
        classId: selectedChild.academic.classId,
        status: "PUBLISHED",
      });
      setAssignments(res.assignments || []);
    } catch (err: any) {
      console.error("loadHomework error:", err);
      setError(err.message || "Failed to load homework assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [organization, selectedChild]);

  if (kids.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <BookOpen className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">No Children Linked</h2>
        <p className="mt-1 text-xs text-muted-foreground">Please contact school administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Homework & Assignments
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Curriculum coursework, project instructions, and submission deadlines for{" "}
          <span className="font-bold text-foreground">{selectedChild?.fullName}</span>
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
          <Button onClick={loadHomework} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <BookOpen className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No active assignments</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            All subject coursework is up to date for Class {selectedChild?.academic.className}.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-bold text-primary uppercase">{a.subjectName}</span>
                  <h3 className="font-extrabold text-sm text-foreground">{a.title}</h3>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                  Max: {a.totalMarks} marks
                </span>
              </div>

              {a.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
              )}

              <div className="flex items-center justify-between text-xs bg-surface/50 p-2.5 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Due: {a.dueDate}
                </span>
                <span className="text-[10px] font-semibold text-foreground">
                  By: {a.teacherName || "Subject Teacher"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
