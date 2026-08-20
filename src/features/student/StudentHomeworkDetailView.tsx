import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  BookOpen,
  Calendar,
  Clock,
  ArrowLeft,
  Upload,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { getAssignmentById } from "@/services/academicWorkService";
import {
  submitAssignmentFile,
  getStudentAssignmentSubmission,
} from "@/services/studentPortalService";
import type { Assignment } from "@/types/academicWork";
import type { StudentSubmission } from "@/services/studentPortalService";
import { Button } from "@/components/ui/button";

export const StudentHomeworkDetailView: React.FC = () => {
  const { assignmentId } = useParams({ strict: false }) as { assignmentId: string };
  const { organization, firebaseUser, userProfile } = useAuth();
  const { student } = useStudent();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState<StudentSubmission | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization || !student || !assignmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [assign, sub] = await Promise.all([
        getAssignmentById(organization.id, assignmentId),
        getStudentAssignmentSubmission(organization.id, assignmentId, student.id),
      ]);
      setAssignment(assign);
      setSubmission(sub);
    } catch (err: any) {
      console.error("loadHomeworkDetail error:", err);
      setError(err.message || "Failed to load assignment details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, student, assignmentId]);

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !student || !firebaseUser || !selectedFile) return;

    setIsUploading(true);
    try {
      const sub = await submitAssignmentFile(
        organization.id,
        assignmentId,
        student.id,
        selectedFile,
        { uid: firebaseUser.uid, name: userProfile?.name || student.fullName }
      );
      setSubmission(sub);
      setSelectedFile(null);
      alert("Assignment submitted successfully!");
    } catch (err: any) {
      alert("Submission failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !assignment) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error || "Assignment not found."}</p>
        <Link
          to="/student/homework"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground hover:bg-secondary"
        >
          <ArrowLeft className="size-3.5" /> Return to Homework
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/student/homework"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-wider">
            {assignment.subjectName}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">{assignment.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Assignment Instructions */}
        <div className="md:col-span-2 rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-extrabold text-foreground">Instructions & Description</h3>

          <div className="text-xs text-muted-foreground whitespace-pre-line leading-relaxed bg-surface/50 p-4 rounded-2xl border border-border">
            {assignment.description || "No specific instructions provided. Complete the assigned tasks as discussed in class."}
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs bg-surface/30 p-3 rounded-2xl border border-border">
            <div>
              <span className="text-[10px] text-muted-foreground block">Assigned Faculty</span>
              <span className="font-bold text-foreground">{assignment.teacherName || "Subject Teacher"}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Maximum Marks</span>
              <span className="font-mono font-bold text-primary">{assignment.totalMarks} Marks</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Issue Date</span>
              <span className="font-mono text-muted-foreground">{assignment.assignedDate || "—"}</span>
            </div>
            <div>
              <span className="text-[10px] text-muted-foreground block">Submission Due Date</span>
              <span className="font-mono font-bold text-rose-600">{assignment.dueDate}</span>
            </div>
          </div>
        </div>

        {/* Submission Panel */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h3 className="text-sm font-extrabold text-foreground">Your Submission</h3>

          {submission ? (
            <div className="bg-surface/50 p-4 rounded-2xl border border-border space-y-3 text-xs">
              <div className="flex items-center gap-2 text-emerald-600 font-bold">
                <CheckCircle2 className="size-4" />
                <span>Submitted</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-mono">
                {submission.submittedAt.split("T")[0]} ({submission.fileName})
              </p>
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-[11px] font-bold text-primary hover:underline"
              >
                View Submitted File ↗
              </a>

              {submission.grade && (
                <div className="pt-2 border-t border-border">
                  <span className="text-[10px] text-muted-foreground block">Grade & Marks</span>
                  <p className="text-sm font-black text-primary">{submission.grade}</p>
                  {submission.feedback && (
                    <p className="text-[11px] text-muted-foreground mt-1 italic">
                      "{submission.feedback}"
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmitFile} className="space-y-4">
              <div className="border-2 border-dashed border-border rounded-2xl p-4 text-center space-y-2 hover:border-primary/50 transition-colors">
                <Upload className="size-8 text-muted-foreground mx-auto" />
                <p className="text-xs font-bold text-foreground">Select File to Upload</p>
                <p className="text-[10px] text-muted-foreground">PDF, Word, or Image up to 10MB</p>
                <input
                  type="file"
                  required
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-muted-foreground file:mr-2 file:py-1 file:px-2.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary cursor-pointer"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                size="sm"
                disabled={isUploading || !selectedFile}
                className="w-full rounded-xl text-xs font-bold"
              >
                {isUploading ? "Uploading..." : "Submit Assignment"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
