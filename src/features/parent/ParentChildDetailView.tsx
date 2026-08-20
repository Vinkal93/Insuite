import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  GraduationCap,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Trophy,
  Bus,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  UserCheck,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import { getAuthorizedChild } from "@/services/parentService";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";

export const ParentChildDetailView: React.FC = () => {
  const { studentId } = useParams({ strict: false }) as { studentId: string };
  const { organization } = useAuth();
  const { parent } = useParent();

  const [student, setStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChild = async () => {
    if (!organization || !parent || !studentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const child = await getAuthorizedChild(organization.id, parent, studentId);
      setStudent(child);
    } catch (err: any) {
      console.error("getAuthorizedChild error:", err);
      setError(err.message || "Unauthorized access: You cannot view this student record.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChild();
  }, [organization, parent, studentId]);

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !student) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center shadow-soft">
        <ShieldAlert className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-sm font-extrabold text-foreground">Access Restricted</h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          {error || "Student record could not be loaded."}
        </p>
        <Link
          to="/parent/children"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="size-3.5" /> Return to My Children
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/parent/children"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground">{student.fullName}</h1>
          <p className="text-xs text-muted-foreground">
            Admission #: <span className="font-mono font-bold text-primary">{student.admissionNumber}</span> • Class {student.academic.className} ({student.academic.sectionName})
          </p>
        </div>
      </div>

      {/* Main Info Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft text-center space-y-4">
          <div className="size-24 rounded-3xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center mx-auto border border-primary/20 overflow-hidden">
            {student.photoUrl ? (
              <img src={student.photoUrl} alt={student.fullName} className="w-full h-full object-cover" />
            ) : (
              student.firstName.charAt(0)
            )}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-foreground">{student.fullName}</h2>
            <span className="inline-block mt-1 px-3 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              {student.status}
            </span>
          </div>

          <div className="text-left bg-surface/50 p-4 rounded-2xl border border-border space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Gender:</span>
              <span className="font-semibold text-foreground">{student.gender}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date of Birth:</span>
              <span className="font-mono text-foreground">{student.dateOfBirth || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Blood Group:</span>
              <span className="font-semibold text-foreground">{student.bloodGroup || "—"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Roll Number:</span>
              <span className="font-mono font-bold text-foreground">{student.academic.rollNumber || "—"}</span>
            </div>
          </div>
        </div>

        {/* Academic & Navigation Details */}
        <div className="md:col-span-2 space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">Academic Information</h3>
            <div className="grid gap-3 sm:grid-cols-2 text-xs">
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Current Class</span>
                <span className="font-bold text-foreground">{student.academic.className}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Assigned Section</span>
                <span className="font-bold text-foreground">{student.academic.sectionName}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Academic Session</span>
                <span className="font-bold text-foreground">{student.academic.sessionName || "Active"}</span>
              </div>
              <div className="bg-surface/50 p-3 rounded-2xl border border-border">
                <span className="text-[10px] text-muted-foreground block">Admission Date</span>
                <span className="font-mono text-foreground">{student.academic.admissionDate || "—"}</span>
              </div>
            </div>
          </div>

          {/* Quick Access Action Shortcuts */}
          <div className="grid gap-3 sm:grid-cols-2">
            <Link
              to="/parent/attendance"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-soft transition-colors"
            >
              <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Attendance Records</h4>
                <p className="text-[10px] text-muted-foreground">Monthly calendar & statistics</p>
              </div>
            </Link>

            <Link
              to="/parent/fees"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-soft transition-colors"
            >
              <div className="size-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Fee Invoices & Receipts</h4>
                <p className="text-[10px] text-muted-foreground">Fee breakdown & payment history</p>
              </div>
            </Link>

            <Link
              to="/parent/homework"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-soft transition-colors"
            >
              <div className="size-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <BookOpen className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Homework & Assignments</h4>
                <p className="text-[10px] text-muted-foreground">Submissions & teacher feedback</p>
              </div>
            </Link>

            <Link
              to="/parent/exams"
              className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border hover:border-primary/40 shadow-soft transition-colors"
            >
              <div className="size-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Trophy className="size-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-foreground">Exams & Published Results</h4>
                <p className="text-[10px] text-muted-foreground">Report cards & grade sheets</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
