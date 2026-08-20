import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Trophy,
  Calendar,
  AlertCircle,
  RefreshCw,
  Award,
  PenTool,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { listExams } from "@/services/examService";
import type { Exam } from "@/types/exam";
import { Button } from "@/components/ui/button";

export const TeacherExamsListView: React.FC = () => {
  const { organization } = useAuth();
  const { teacher, allocations } = useTeacher();

  const [exams, setExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadExams = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listExams(organization.id, {});
      setExams(list);
    } catch (err: any) {
      console.error("loadTeacherExams error:", err);
      setError(err.message || "Failed to load examinations.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Assessments & Marks Entry
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Term examinations, subject assessment schedules, and marks entry workflows.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadExams} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : exams.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Trophy className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No active exams</h3>
          <p className="mt-1 text-xs text-muted-foreground">Examination schedules will appear here once configured.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {exams.map((e) => (
            <div
              key={e.id}
              className="p-5 rounded-3xl border border-border bg-card shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-primary/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-foreground">{e.name}</h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      e.status === "ACTIVE"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {e.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  Dates: {e.startDate} to {e.endDate} • Type: {e.type}
                </p>
              </div>

              <Link
                to={`/teacher/marks/${e.id}`}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-card border border-border hover:border-primary text-xs font-bold text-primary shadow-sm transition-colors self-start sm:self-center"
              >
                <PenTool className="size-3.5" /> Enter Marks <ArrowRight className="size-3.5" />
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
