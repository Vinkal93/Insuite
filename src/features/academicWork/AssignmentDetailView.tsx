import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  ArrowLeft,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Users,
  Edit,
  Send,
  Lock,
  Archive,
  Loader2,
  RefreshCw,
  Eye,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAssignmentById,
  getSubmissionsForAssignment,
  publishAssignment,
  closeAssignment,
  archiveAssignment,
  getAuditLogsForEntity,
} from "@/services";
import type { Assignment, Submission, AuditLog } from "@/types";
import { Button } from "@/components/ui/button";

export const AssignmentDetailView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const routeParams = useParams({ strict: false }) as { assignmentId?: string };
  const assignmentId = routeParams?.assignmentId;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [timeline, setTimeline] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization || !assignmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [assign, subs, logs] = await Promise.all([
        getAssignmentById(organization.id, assignmentId),
        getSubmissionsForAssignment(organization.id, assignmentId),
        getAuditLogsForEntity(organization.id, assignmentId),
      ]);

      if (!assign) {
        setError("Assignment not found or may have been removed.");
      } else {
        setAssignment(assign);
        setSubmissions(subs);
        setTimeline(logs);
      }
    } catch (err: any) {
      console.error("Load assignment detail error:", err);
      setError(err.message || "Unable to load assignment details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, assignmentId]);

  const handlePublish = async () => {
    if (!organization || !assignmentId || !firebaseUser) return;
    setActionLoading(true);
    try {
      await publishAssignment(
        organization.id,
        assignmentId,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Assignment published successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to publish assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleClose = async () => {
    if (!organization || !assignmentId || !firebaseUser) return;
    setActionLoading(true);
    try {
      await closeAssignment(
        organization.id,
        assignmentId,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Assignment closed for submissions.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to close assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!organization || !assignmentId || !firebaseUser) return;
    setActionLoading(true);
    try {
      await archiveAssignment(
        organization.id,
        assignmentId,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Assignment archived.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to archive assignment.");
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 text-xs font-semibold">Loading assignment details...</p>
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <AlertCircle className="mx-auto size-8 mb-2" />
          <h2 className="text-base font-bold">Unable to Load Assignment</h2>
          <p className="mt-1 text-xs">{error || "The requested assignment could not be found."}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/academic-work/assignments">Back to Assignments</Link>
        </Button>
      </div>
    );
  }

  // Calculated Real Statistics
  const submittedCount = submissions.length;
  const gradedCount = submissions.filter((s) => s.status === "Graded").length;
  const needsGradingCount = submissions.filter(
    (s) => s.status === "Submitted" || s.status === "Late" || s.status === "Needs Grading"
  ).length;
  const lateCount = submissions.filter((s) => s.late).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/academic-work/assignments">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-muted-foreground">
                {assignment.type}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  assignment.status === "published"
                    ? "bg-success/15 text-success"
                    : assignment.status === "draft"
                    ? "bg-secondary text-muted-foreground"
                    : "bg-destructive/15 text-destructive"
                }`}
              >
                {assignment.status}
              </span>
            </div>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
              {assignment.title}
            </h1>
            <p className="text-xs text-muted-foreground">
              {assignment.className} ({assignment.sectionName}) • {assignment.subjectName} • Teacher: {assignment.teacherName}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link
              to="/academic-work/assignments/$assignmentId/edit"
              params={{ assignmentId: assignment.id }}
            >
              <Edit className="size-3.5 mr-1" /> Edit
            </Link>
          </Button>

          {assignment.status === "draft" && (
            <Button
              variant="hero"
              size="sm"
              disabled={actionLoading}
              onClick={handlePublish}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <Send className="size-3.5 mr-1" /> Publish Now
            </Button>
          )}

          {assignment.status === "published" && (
            <Button
              variant="outline"
              size="sm"
              disabled={actionLoading}
              onClick={handleClose}
              className="rounded-xl text-xs font-semibold text-amber-500 hover:bg-amber-500/10"
            >
              <Lock className="size-3.5 mr-1" /> Close Submissions
            </Button>
          )}

          {assignment.status !== "archived" && (
            <Button
              variant="ghost"
              size="sm"
              disabled={actionLoading}
              onClick={handleArchive}
              className="rounded-xl text-xs font-semibold"
            >
              <Archive className="size-3.5 mr-1" /> Archive
            </Button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Submission Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Submissions
          </span>
          <p className="mt-2 text-2xl font-black text-foreground">{submittedCount}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500">
            Needs Grading
          </span>
          <p className="mt-2 text-2xl font-black text-amber-500">{needsGradingCount}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
            Graded
          </span>
          <p className="mt-2 text-2xl font-black text-emerald-600">{gradedCount}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-500">
            Late Submissions
          </span>
          <p className="mt-2 text-2xl font-black text-rose-500">{lateCount}</p>
        </div>
      </div>

      {/* Detail Content & Instructions */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Objective & Instructions */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-muted-foreground">
              Assignment Overview
            </h2>
            <p className="text-xs text-foreground font-medium">{assignment.description}</p>

            <div className="pt-3 border-t border-border space-y-2">
              <h3 className="text-xs font-bold text-foreground">Detailed Instructions</h3>
              <p className="whitespace-pre-line text-xs leading-relaxed text-muted-foreground">
                {assignment.instructions}
              </p>
            </div>

            {/* Attachments */}
            {assignment.attachments && assignment.attachments.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <h3 className="text-xs font-bold text-foreground">Reference Attachments</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {assignment.attachments.map((att, i) => (
                    <a
                      key={i}
                      href={att.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 rounded-xl border border-border bg-surface p-3 text-xs hover:border-primary transition-colors"
                    >
                      <Paperclip className="size-4 text-primary shrink-0" />
                      <div className="truncate">
                        <p className="font-bold text-foreground truncate">{att.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round(att.size / 1024)} KB
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submissions List */}
          <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
            <div className="border-b border-border px-6 py-4">
              <h2 className="text-sm font-extrabold text-foreground">Student Submissions</h2>
              <p className="text-xs text-muted-foreground">Submissions received for this task</p>
            </div>

            {submissions.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                <Users className="mx-auto size-7 opacity-40" />
                <p className="mt-2 text-xs font-semibold">No student submissions received yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="px-6 py-3.5 font-bold">Student</th>
                      <th className="px-4 py-3.5 font-bold">Submitted Date</th>
                      <th className="px-4 py-3.5 font-bold">Status</th>
                      <th className="px-4 py-3.5 font-bold">Score</th>
                      <th className="px-6 py-3.5 font-bold text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {submissions.map((s) => (
                      <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                        <td className="px-6 py-4 font-bold text-foreground">
                          {s.studentName || s.studentId}
                          {s.studentRollNumber && (
                            <span className="text-[10px] text-muted-foreground font-normal ml-1.5">
                              (Roll #{s.studentRollNumber})
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-mono text-muted-foreground">
                          {s.submittedAt ? new Date(s.submittedAt).toLocaleDateString() : "—"}
                          {s.late && (
                            <span className="ml-1.5 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-bold text-rose-500">
                              LATE
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase ${
                              s.status === "Graded"
                                ? "bg-success/15 text-success"
                                : s.status === "Returned"
                                ? "bg-secondary text-muted-foreground"
                                : "bg-amber-500/15 text-amber-500"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-mono font-bold text-foreground">
                          {s.marks !== undefined ? `${s.marks} / ${assignment.grading.maximumMarks || 100}` : "—"}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
                            <Link
                              to="/academic-work/submissions/$submissionId"
                              params={{ submissionId: s.id }}
                              search={{ assignmentId: assignment.id }}
                            >
                              Grade / View
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

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Schedule Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Schedule & Evaluation
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Assigned Date:</span>
                <span className="font-mono font-semibold text-foreground">{assignment.assignedDate}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Due Date:</span>
                <span className="font-mono font-bold text-foreground">
                  {assignment.dueDate} {assignment.dueTime ? `(${assignment.dueTime})` : ""}
                </span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Max Marks:</span>
                <span className="font-mono font-semibold text-foreground">
                  {assignment.grading?.enabled ? assignment.grading.maximumMarks : "Not Graded"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Passing Marks:</span>
                <span className="font-mono font-semibold text-foreground">
                  {assignment.grading?.enabled ? assignment.grading.passingMarks : "—"}
                </span>
              </div>
            </div>
          </div>

          {/* Audit Timeline */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Activity History
            </h3>

            {timeline.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No historical audit logs found.</p>
            ) : (
              <div className="space-y-3">
                {timeline.map((log) => (
                  <div key={log.id} className="border-l-2 border-primary/30 pl-3 py-0.5 text-xs">
                    <p className="font-bold text-foreground">{log.action.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-muted-foreground">
                      By {log.actorName} • {new Date(log.timestamp).toLocaleDateString()}
                    </p>
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
