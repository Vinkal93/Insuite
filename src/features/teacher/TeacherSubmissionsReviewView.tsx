import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  FileCheck,
  ArrowLeft,
  Users,
  CheckCircle2,
  Clock,
  Download,
  AlertCircle,
  RefreshCw,
  Save,
  Award,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import {
  getAssignmentById,
  getSubmissionsForAssignment,
  gradeSubmission,
} from "@/services/academicWorkService";
import { getClassStudents } from "@/services/academicService";
import type { Assignment, AssignmentSubmission } from "@/types/academicWork";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";

export const TeacherSubmissionsReviewView: React.FC = () => {
  const { assignmentId } = useParams({ strict: false }) as { assignmentId: string };
  const { organization, firebaseUser, userProfile } = useAuth();
  const { teacher } = useTeacher();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [gradeMarks, setGradeMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [isGrading, setIsGrading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAll = async () => {
    if (!organization || !assignmentId) return;
    setIsLoading(true);
    setError(null);
    try {
      const assign = await getAssignmentById(organization.id, assignmentId);
      setAssignment(assign);

      if (assign) {
        const [subs, stus] = await Promise.all([
          getSubmissionsForAssignment(organization.id, assignmentId),
          getClassStudents(organization.id, assign.classId),
        ]);
        setSubmissions(subs);
        setStudents(stus);
      }
    } catch (err: any) {
      console.error("loadSubmissionsReview error:", err);
      setError(err.message || "Failed to load submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [organization, assignmentId]);

  const handleOpenGradeModal = (sub: AssignmentSubmission) => {
    setSelectedSubmission(sub);
    setGradeMarks(sub.marksObtained !== undefined ? String(sub.marksObtained) : "");
    setFeedback(sub.feedback || "");
  };

  const handleSaveGrade = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedSubmission || !assignment) return;

    const numMarks = Number(gradeMarks);
    if (isNaN(numMarks) || numMarks < 0 || numMarks > assignment.totalMarks) {
      alert(`Please enter valid marks between 0 and ${assignment.totalMarks}.`);
      return;
    }

    setIsGrading(true);
    try {
      await gradeSubmission(
        organization.id,
        assignment.id,
        selectedSubmission.id,
        {
          marksObtained: numMarks,
          feedback: feedback.trim(),
        },
        { uid: firebaseUser.uid, name: userProfile?.name || teacher?.fullName || "Teacher" }
      );

      alert("Submission evaluated successfully!");
      setSelectedSubmission(null);
      await loadAll();
    } catch (err: any) {
      alert("Failed to save grade: " + err.message);
    } finally {
      setIsGrading(false);
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
          to="/teacher/submissions"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Return to Submissions
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/teacher/submissions"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <span className="text-[10px] font-bold text-primary uppercase">
            Class {assignment.className} ({assignment.sectionName}) • {assignment.subjectName}
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">{assignment.title}</h1>
        </div>
      </div>

      {/* Submissions Roster */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="p-4 border-b border-border bg-surface/50 flex items-center justify-between">
          <span className="text-xs font-bold text-foreground">
            Student Work ({submissions.length} submitted of {students.length} students)
          </span>
          <span className="text-xs font-mono font-bold text-primary">
            Max Marks: {assignment.totalMarks}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground font-bold text-[10px] uppercase">
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Submission Status</th>
                <th className="py-3 px-4">Submitted At</th>
                <th className="py-3 px-4">Score / Grade</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {students.map((s) => {
                const sub = submissions.find((subItem) => subItem.studentId === s.id);

                return (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {s.academic.rollNumber || s.firstName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{s.fullName}</p>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            Adm: {s.admissionNumber}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {sub ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {sub.status || "Submitted"}
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground">
                          Not Submitted
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground font-mono">
                      {sub?.submittedAt ? sub.submittedAt.split("T")[0] : "—"}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {sub?.marksObtained !== undefined
                        ? `${sub.marksObtained} / ${assignment.totalMarks}`
                        : "Ungraded"}
                    </td>

                    <td className="py-3 px-4 text-right">
                      {sub ? (
                        <div className="flex items-center justify-end gap-2">
                          {sub.attachments && sub.attachments.length > 0 && (
                            <a
                              href={sub.attachments[0].fileUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg border border-border bg-surface hover:border-primary text-primary transition-colors inline-block"
                              title="Download Attachment"
                            >
                              <Download className="size-3.5" />
                            </a>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenGradeModal(sub)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5"
                          >
                            <Award className="size-3 mr-1" /> Grade
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Grading Modal */}
      {selectedSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground">
                Grade Submission: {selectedSubmission.studentName}
              </h3>
              <button
                onClick={() => setSelectedSubmission(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveGrade} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Marks Obtained (Max: {assignment.totalMarks}) *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  max={assignment.totalMarks}
                  value={gradeMarks}
                  onChange={(e) => setGradeMarks(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">Teacher Feedback</label>
                <textarea
                  rows={3}
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Feedback on handwriting, accuracy, corrections..."
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedSubmission(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isGrading || !gradeMarks}
                  className="rounded-xl text-xs font-bold"
                >
                  <Save className="size-3.5 mr-1" />
                  {isGrading ? "Saving..." : "Save Grade"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
