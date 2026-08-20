import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  User,
  ArrowLeft,
  CalendarCheck,
  BookOpen,
  Trophy,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getStudent } from "@/services/studentService";
import { getStudentAttendanceSummary } from "@/services/attendanceService";
import { listResults } from "@/services/examService";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";

export const TeacherStudentDetailView: React.FC = () => {
  const { studentId } = useParams({ strict: false }) as { studentId: string };
  const { organization } = useAuth();

  const [student, setStudent] = useState<Student | null>(null);
  const [attendance, setAttendance] = useState<any | null>(null);
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStudentDossier = async () => {
    if (!organization || !studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const s = await getStudent(organization.id, studentId);
      setStudent(s);

      if (s) {
        const [att, resList] = await Promise.all([
          getStudentAttendanceSummary(organization.id, s.id, s.academic.sessionId).catch(() => null),
          listResults(organization.id, { studentId: s.id, status: "PUBLISHED" }).catch(() => []),
        ]);
        setAttendance(att);
        setResults(resList);
      }
    } catch (err: any) {
      console.error("loadStudentDossier error:", err);
      setError(err.message || "Failed to load student record.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStudentDossier();
  }, [organization, studentId]);

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !student) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error || "Student not found."}</p>
        <Link
          to="/teacher/classes"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Return to Classes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/teacher/classes"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <span className="text-[10px] font-bold text-primary uppercase">
            Class {student.academic.className} ({student.academic.sectionName})
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">{student.fullName}</h1>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Identity Dossier */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft text-center space-y-4">
          <div className="size-20 rounded-3xl bg-primary/10 text-primary font-black text-xl flex items-center justify-center mx-auto overflow-hidden border border-primary/20">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              student.firstName.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">{student.fullName}</h2>
            <p className="text-xs font-bold text-primary mt-0.5">
              Roll #{student.academic.rollNumber || "—"} • Adm #{student.admissionNumber}
            </p>
          </div>

          <div className="bg-surface/50 p-3.5 rounded-2xl border border-border space-y-2 text-xs text-left">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-semibold text-foreground">{student.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Session:</span>
              <span className="font-semibold text-foreground">{student.academic.sessionName || "Active"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Admitted:</span>
              <span className="font-mono text-muted-foreground">{student.academic.admissionDate || "—"}</span>
            </div>
          </div>
        </div>

        {/* Academic Performance & Attendance */}
        <div className="md:col-span-2 space-y-6">
          {/* Attendance Stats */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Attendance Track</h3>
                <p className="text-[10px] text-muted-foreground">Roll call presence history</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Overall Rate</span>
                <span className="text-lg font-black text-primary">
                  {attendance ? `${attendance.percentage}%` : "—"}
                </span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Present Days</span>
                <span className="text-lg font-black text-emerald-600">
                  {attendance?.presentDays || 0}
                </span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Absent Days</span>
                <span className="text-lg font-black text-rose-600">
                  {attendance?.absentDays || 0}
                </span>
              </div>
            </div>
          </div>

          {/* Exam Results */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Trophy className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Published Exam Marks</h3>
                <p className="text-[10px] text-muted-foreground">Term assessments and grades</p>
              </div>
            </div>

            {results.length === 0 ? (
              <div className="bg-surface/30 p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No published exam results for this student yet.
              </div>
            ) : (
              <div className="space-y-2 text-xs">
                {results.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-2xl bg-surface/50 border border-border flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-bold text-foreground">{r.examName}</h4>
                      <p className="text-[10px] text-muted-foreground">Grade: {r.grade}</p>
                    </div>
                    <span className="font-mono font-bold text-primary">{r.percentage}%</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
