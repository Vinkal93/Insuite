import React, { useState, useEffect } from "react";
import { Link, useParams, useSearch, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ClipboardCheck,
  ArrowLeft,
  Calendar,
  Clock,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RotateCcw,
  User,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  gradeSubmissionSchema,
  returnSubmissionSchema,
  type GradeSubmissionInput,
  type ReturnSubmissionInput,
} from "@/schemas";
import {
  getSubmissionById,
  getAssignmentById,
  gradeSubmission,
  returnSubmission,
} from "@/services";
import type { Submission, Assignment } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const SubmissionDetailView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const routeParams = useParams({ strict: false }) as { submissionId?: string };
  const submissionId = routeParams?.submissionId;
  const search = useSearch({ strict: false }) as { assignmentId?: string };
  const assignmentId = search?.assignmentId;

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGrading, setIsGrading] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const gradeForm = useForm<GradeSubmissionInput>({
    resolver: zodResolver(gradeSubmissionSchema),
    defaultValues: {
      marks: 0,
      feedback: "",
    },
  });

  const returnForm = useForm<ReturnSubmissionInput>({
    resolver: zodResolver(returnSubmissionSchema),
    defaultValues: {
      action: "Return",
      resubmissionReason: "",
      feedback: "",
    },
  });

  const loadData = async () => {
    if (!organization || !submissionId || !assignmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sub, assign] = await Promise.all([
        getSubmissionById(organization.id, assignmentId, submissionId),
        getAssignmentById(organization.id, assignmentId),
      ]);

      if (!sub) {
        setError("Submission record not found.");
      } else {
        setSubmission(sub);
        setAssignment(assign);

        gradeForm.reset({
          marks: sub.marks ?? (assign?.grading?.maximumMarks || 100),
          feedback: sub.feedback || "",
        });
      }
    } catch (err: any) {
      console.error("Load submission error:", err);
      setError(err.message || "Unable to load submission.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, submissionId, assignmentId]);

  const onGradeSubmit = async (data: GradeSubmissionInput) => {
    if (!organization || !submissionId || !assignmentId || !firebaseUser) return;
    const maxMarks = assignment?.grading?.maximumMarks || 100;
    if (data.marks > maxMarks) {
      setError(`Marks cannot exceed the maximum of ${maxMarks}`);
      return;
    }

    setIsGrading(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await gradeSubmission(
        organization.id,
        assignmentId,
        submissionId,
        data,
        maxMarks,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Marks and feedback saved successfully.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to save grade.");
    } finally {
      setIsGrading(false);
    }
  };

  const onReturnSubmit = async (data: ReturnSubmissionInput) => {
    if (!organization || !submissionId || !assignmentId || !firebaseUser) return;
    setIsReturning(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await returnSubmission(
        organization.id,
        assignmentId,
        submissionId,
        data,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg(`Submission ${data.action === "Request Resubmission" ? "resubmission requested" : "returned"}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to process return.");
    } finally {
      setIsReturning(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-8 animate-spin text-primary" />
        <p className="mt-3 text-xs font-semibold">Loading student submission...</p>
      </div>
    );
  }

  if (error && !submission) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
          <AlertCircle className="mx-auto size-8 mb-2" />
          <h2 className="text-base font-bold">Unable to Load Submission</h2>
          <p className="mt-1 text-xs">{error}</p>
        </div>
        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/academic-work/submissions">Back to Submissions</Link>
        </Button>
      </div>
    );
  }

  const maxMarks = assignment?.grading?.maximumMarks || 100;
  const currentMarks = gradeForm.watch("marks");
  const computedPercentage = Math.round((currentMarks / maxMarks) * 100);

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academic-work/submissions">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                submission?.status === "Graded"
                  ? "bg-success/15 text-success"
                  : submission?.status === "Returned"
                  ? "bg-secondary text-muted-foreground"
                  : "bg-amber-500/15 text-amber-500"
              }`}
            >
              {submission?.status}
            </span>
            {submission?.late && (
              <span className="rounded bg-rose-500/10 px-2 py-0.5 text-[10px] font-extrabold text-rose-500">
                LATE SUBMISSION
              </span>
            )}
          </div>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {submission?.studentName || "Student Submission"}
          </h1>
          <p className="text-xs text-muted-foreground">
            Task: {assignment?.title} • {assignment?.className} ({assignment?.sectionName}) • {assignment?.subjectName}
          </p>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Col: Submission Answers & Files */}
        <div className="space-y-6 lg:col-span-2">
          {/* Content / Answer */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Submitted Work & Answers
            </h2>

            {submission?.content ? (
              <div className="rounded-2xl border border-border bg-surface p-4 text-xs leading-relaxed text-foreground whitespace-pre-line">
                {submission.content}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground italic">
                No text response provided. Check attached documents below.
              </p>
            )}

            {/* Attachments */}
            {submission?.attachments && submission.attachments.length > 0 && (
              <div className="pt-3 border-t border-border space-y-2">
                <h3 className="text-xs font-bold text-foreground">Student Submitted Files</h3>
                <div className="grid gap-2 sm:grid-cols-2">
                  {submission.attachments.map((att, i) => (
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

          {/* Grading Desk Form */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Evaluation & Scoring
            </h2>

            <form onSubmit={gradeForm.handleSubmit(onGradeSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">
                    Marks Awarded (Max: {maxMarks}) *
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={maxMarks}
                    {...gradeForm.register("marks")}
                    className="rounded-xl border-border bg-surface text-xs font-bold text-base"
                  />
                  {gradeForm.formState.errors.marks && (
                    <p className="text-[11px] text-destructive">
                      {gradeForm.formState.errors.marks.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Computed Percentage</Label>
                  <div className="flex h-10 items-center rounded-xl border border-border bg-surface px-3 text-sm font-black text-primary">
                    {isNaN(computedPercentage) ? "0%" : `${computedPercentage}%`}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Teacher Feedback & Comments</Label>
                <Textarea
                  rows={3}
                  placeholder="Provide constructive feedback, corrections, or praise..."
                  {...gradeForm.register("feedback")}
                  className="rounded-xl border-border bg-surface text-xs leading-relaxed"
                />
              </div>

              <Button
                type="submit"
                variant="hero"
                disabled={isGrading}
                className="rounded-xl text-xs font-bold shadow-soft"
              >
                {isGrading ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
                Save Grade & Marks
              </Button>
            </form>
          </div>
        </div>

        {/* Right Col: Action & Submission Metadata */}
        <div className="space-y-6">
          {/* Submission Info */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              Submission Details
            </h3>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Submitted At:</span>
              <span className="font-mono font-bold text-foreground">
                {submission?.submittedAt ? new Date(submission.submittedAt).toLocaleDateString() : "—"}
              </span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Attempt #:</span>
              <span className="font-mono font-bold text-foreground">
                {submission?.attemptNumber || 1}
              </span>
            </div>
            {submission?.gradedAt && (
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Evaluated By:</span>
                <span className="font-semibold text-foreground">{submission.gradedByName || "Teacher"}</span>
              </div>
            )}
          </div>

          {/* Return / Request Resubmission */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
              Return or Request Resubmission
            </h3>

            <form onSubmit={returnForm.handleSubmit(onReturnSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Action</Label>
                <select
                  {...returnForm.register("action")}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Return">Return to Student</option>
                  <option value="Request Resubmission">Request Resubmission</option>
                </select>
              </div>

              {returnForm.watch("action") === "Request Resubmission" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-rose-500">
                    Reason for Resubmission *
                  </Label>
                  <Input
                    placeholder="e.g. Incomplete calculations, wrong file format..."
                    {...returnForm.register("resubmissionReason")}
                    className="rounded-xl border-border bg-surface text-xs"
                  />
                  {returnForm.formState.errors.resubmissionReason && (
                    <p className="text-[11px] text-destructive">
                      {returnForm.formState.errors.resubmissionReason.message}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                variant="outline"
                disabled={isReturning}
                className="w-full rounded-xl text-xs font-bold"
              >
                {isReturning ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <RotateCcw className="size-3.5 mr-1.5" />}
                Submit Action
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
