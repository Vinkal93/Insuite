import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  AlertCircle,
  RefreshCw,
  Clock,
  CheckCircle2,
  FileText,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { getAssignments } from "@/services/academicWorkService";
import type { Assignment } from "@/types/academicWork";
import { Button } from "@/components/ui/button";

export const StudentHomeworkListView: React.FC = () => {
  const { organization } = useAuth();
  const { student } = useStudent();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHomework = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await getAssignments(organization.id, {
        sessionId: student.academic.sessionId,
        classId: student.academic.classId,
        status: "PUBLISHED",
      });
      setAssignments(res.assignments || []);
    } catch (err: any) {
      console.error("loadStudentHomework error:", err);
      setError(err.message || "Failed to load homework.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, [organization, student]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Homework & Coursework
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Subject assignments, project instructions, and submission deadlines.
        </p>
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
          <Button onClick={loadHomework} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <BookOpen className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No active assignments</h3>
          <p className="mt-1 text-xs text-muted-foreground">You are all caught up with your schoolwork.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {assignments.map((a) => (
            <div
              key={a.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between">
                  <span className="text-[10px] font-bold text-primary uppercase">{a.subjectName}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                    Max: {a.totalMarks} marks
                  </span>
                </div>
                <h3 className="font-extrabold text-sm text-foreground">{a.title}</h3>
                {a.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{a.description}</p>
                )}
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Clock className="size-3" /> Due: {a.dueDate}
                </span>
                <Link
                  to={`/student/homework/${a.id}`}
                  className="font-bold text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  View Details & Submit <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
