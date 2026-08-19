import React, { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  ArrowLeft,
  GraduationCap,
  Layers,
  BookOpen,
  Calendar,
  Clock,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Save,
  Users,
  ShieldCheck,
  Send,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { assignmentSchema, type AssignmentInput } from "@/schemas";
import {
  getSchoolClasses,
  getSections,
  getSubjects,
  getTeachers,
  getStudentsBySection,
  getAcademicSessionsList,
  getAssignmentById,
  createAssignment,
  updateAssignment,
  uploadAssignmentAttachment,
} from "@/services";
import type {
  SchoolClass,
  Section,
  Subject,
  Teacher,
  Student,
  AcademicSessionItem,
  AssignmentType,
  AssignmentAttachment,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface CreateAssignmentViewProps {
  initialType?: AssignmentType;
  isEditMode?: boolean;
}

export const CreateAssignmentView: React.FC<CreateAssignmentViewProps> = ({
  initialType,
  isEditMode = false,
}) => {
  const { organization, selectedSession, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const routeParams = useParams({ strict: false }) as { assignmentId?: string };
  const assignmentId = routeParams?.assignmentId;

  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [studentsList, setStudentsList] = useState<Student[]>([]);
  const [sessionsList, setSessionsList] = useState<AcademicSessionItem[]>([]);

  const [attachments, setAttachments] = useState<AssignmentAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const form = useForm<AssignmentInput>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: "",
      description: "",
      type: initialType || "Homework",
      academicSessionId: selectedSession?.id || "",
      classId: "",
      sectionId: "",
      subjectId: "",
      teacherId: "",
      targetType: "ALL_STUDENTS",
      assignedStudentIds: [],
      assignedDate: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      dueTime: "17:00",
      instructions: "",
      attachments: [],
      grading: {
        enabled: true,
        maximumMarks: 100,
        passingMarks: 40,
        gradeType: "Marks",
      },
      status: "published",
    },
  });

  const selectedClassId = form.watch("classId");
  const selectedSectionId = form.watch("sectionId");
  const selectedTargetType = form.watch("targetType");
  const isGradingEnabled = form.watch("grading.enabled");

  // Load initial lookups
  useEffect(() => {
    if (!organization) return;
    setIsLoading(true);
    Promise.all([
      getSchoolClasses(organization.id, selectedSession?.id),
      getSubjects(organization.id),
      getTeachers(organization.id, "active"),
      getAcademicSessionsList(organization.id),
      isEditMode && assignmentId ? getAssignmentById(organization.id, assignmentId) : Promise.resolve(null),
    ]).then(([classes, subjects, teachers, sessions, existing]) => {
      setClassesList(classes);
      setSubjectsList(subjects);
      setTeachersList(teachers);
      setSessionsList(sessions);

      if (existing) {
        form.reset({
          title: existing.title,
          description: existing.description,
          type: existing.type,
          academicSessionId: existing.academicSessionId,
          classId: existing.classId,
          sectionId: existing.sectionId,
          subjectId: existing.subjectId,
          teacherId: existing.teacherId,
          targetType: existing.targetType,
          assignedStudentIds: existing.assignedStudentIds || [],
          assignedDate: existing.assignedDate,
          dueDate: existing.dueDate,
          dueTime: existing.dueTime || "17:00",
          instructions: existing.instructions,
          attachments: existing.attachments || [],
          grading: existing.grading || {
            enabled: true,
            maximumMarks: 100,
            passingMarks: 40,
            gradeType: "Marks",
          },
          status: existing.status,
        });
        setAttachments(existing.attachments || []);
      } else {
        if (classes.length > 0) form.setValue("classId", classes[0].id);
        if (sessions.length > 0 && !selectedSession) {
          const active = sessions.find((s) => s.isActive) || sessions[0];
          form.setValue("academicSessionId", active.id);
        }
      }
      setIsLoading(false);
    });
  }, [organization, selectedSession, isEditMode, assignmentId]);

  // Load sections when class changes
  useEffect(() => {
    if (!organization || !selectedClassId) return;
    getSections(organization.id, selectedClassId, form.watch("academicSessionId")).then((secs) => {
      setSectionsList(secs);
      if (secs.length > 0 && !isEditMode) {
        form.setValue("sectionId", secs[0].id);
      }
    });
  }, [organization, selectedClassId]);

  // Load students for target selection
  useEffect(() => {
    if (!organization || !selectedClassId || !selectedSectionId || selectedTargetType !== "SELECTED_STUDENTS") {
      setStudentsList([]);
      return;
    }
    getStudentsBySection(organization.id, selectedClassId, selectedSectionId).then(setStudentsList);
  }, [organization, selectedClassId, selectedSectionId, selectedTargetType]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !organization) return;
    const file = e.target.files[0];

    // File validation: 15MB limit
    if (file.size > 15 * 1024 * 1024) {
      setError("File size exceeds maximum allowed limit of 15MB.");
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const tempAssignmentId = assignmentId || `temp_${Date.now()}`;
      const uploaded = await uploadAssignmentAttachment(
        organization.id,
        tempAssignmentId,
        file,
        (prog) => setUploadProgress(Math.round(prog))
      );

      const nextAttachments = [...attachments, uploaded];
      setAttachments(nextAttachments);
      form.setValue("attachments", nextAttachments);
      setSuccessMsg(`Uploaded "${file.name}" successfully.`);
    } catch (err: any) {
      setError(err.message || "Failed to upload file to storage.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAttachment = (index: number) => {
    const updated = attachments.filter((_, i) => i !== index);
    setAttachments(updated);
    form.setValue("attachments", updated);
  };

  const onSave = async (data: AssignmentInput, status: "draft" | "published") => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);

    const payload: AssignmentInput = {
      ...data,
      attachments,
      status,
    };

    try {
      if (isEditMode && assignmentId) {
        await updateAssignment(
          organization.id,
          assignmentId,
          payload,
          firebaseUser.uid,
          userProfile?.displayName || "Teacher"
        );
        setSuccessMsg("Assignment updated successfully.");
      } else {
        const created = await createAssignment(
          organization.id,
          payload,
          firebaseUser.uid,
          userProfile?.displayName || "Teacher"
        );
        setSuccessMsg("Assignment created successfully.");
      }

      setTimeout(() => {
        navigate({ to: "/academic-work/assignments" });
      }, 1000);
    } catch (err: any) {
      console.error("Save assignment error:", err);
      setError(err.message || "Unable to save assignment changes.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academic-work/assignments">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {isEditMode ? "Edit Assignment" : "Create New Assignment"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Configure learning task, schedule deadlines, instructions, and target student group.
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

      <form className="space-y-6">
        {/* SECTION A — BASIC */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <FileText className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              A. Basic Information & Academic Scope
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Assignment Title *</Label>
              <Input
                placeholder="e.g. Chapter 4 Thermodynamics Problem Set"
                {...form.register("title")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.title && (
                <p className="text-[11px] text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-semibold">Short Summary / Objective *</Label>
              <Input
                placeholder="Brief objective of this learning task..."
                {...form.register("description")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {form.formState.errors.description && (
                <p className="text-[11px] text-destructive">{form.formState.errors.description.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assignment Type *</Label>
              <select
                {...form.register("type")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Homework">Homework</option>
                <option value="Classwork">Classwork</option>
                <option value="Project">Project</option>
                <option value="Worksheet">Worksheet</option>
                <option value="Practice">Practice</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Academic Session *</Label>
              <select
                {...form.register("academicSessionId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {sessionsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Class Grade *</Label>
              <select
                {...form.register("classId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Section *</Label>
              <select
                {...form.register("sectionId")}
                disabled={sectionsList.length === 0}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              >
                {sectionsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Subject *</Label>
              <select
                {...form.register("subjectId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select Subject --</option>
                {subjectsList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {form.formState.errors.subjectId && (
                <p className="text-[11px] text-destructive">{form.formState.errors.subjectId.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Teacher in Charge *</Label>
              <select
                {...form.register("teacherId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select Teacher --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.personal.fullName}
                  </option>
                ))}
              </select>
              {form.formState.errors.teacherId && (
                <p className="text-[11px] text-destructive">{form.formState.errors.teacherId.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION B — SCHEDULE */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Clock className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              B. Timeline & Due Date
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Assigned Date *</Label>
              <Input
                type="date"
                {...form.register("assignedDate")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Due Date *</Label>
              <Input
                type="date"
                {...form.register("dueDate")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.dueDate && (
                <p className="text-[11px] text-destructive">{form.formState.errors.dueDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Due Time</Label>
              <Input
                type="time"
                {...form.register("dueTime")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>
          </div>
        </div>

        {/* SECTION C — INSTRUCTIONS */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <BookOpen className="size-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              C. Instructions & Guidelines
            </h2>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold">Detailed Instructions for Students *</Label>
            <Textarea
              rows={5}
              placeholder="Step-by-step instructions, reference materials, formatting requirements..."
              {...form.register("instructions")}
              className="rounded-xl border-border bg-surface text-xs leading-relaxed"
            />
            {form.formState.errors.instructions && (
              <p className="text-[11px] text-destructive">{form.formState.errors.instructions.message}</p>
            )}
          </div>
        </div>

        {/* SECTION D — ATTACHMENTS */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Paperclip className="size-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              D. Attachments & Worksheets (PDF, DOCX, Images)
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="file-upload"
                disabled={isUploading}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploading}
                onClick={() => document.getElementById("file-upload")?.click()}
                className="rounded-xl text-xs font-semibold"
              >
                {isUploading ? (
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                ) : (
                  <UploadCloud className="size-3.5 mr-1.5" />
                )}
                {isUploading ? `Uploading ${uploadProgress}%...` : "Upload File"}
              </Button>
              <span className="text-[11px] text-muted-foreground">Max 15MB per file</span>
            </div>

            {attachments.length > 0 && (
              <div className="space-y-2 pt-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Paperclip className="size-3.5 text-primary shrink-0" />
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold hover:underline truncate text-foreground"
                      >
                        {att.name}
                      </a>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        ({Math.round(att.size / 1024)} KB)
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveAttachment(i)}
                      className="size-7 rounded-lg text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2 className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* SECTION E — STUDENT TARGET */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Users className="size-4 text-purple-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              E. Student Target
            </h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  value="ALL_STUDENTS"
                  {...form.register("targetType")}
                  className="size-4 text-primary"
                />
                Entire Section
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                <input
                  type="radio"
                  value="SELECTED_STUDENTS"
                  {...form.register("targetType")}
                  className="size-4 text-primary"
                />
                Selected Students Only
              </label>
            </div>

            {selectedTargetType === "SELECTED_STUDENTS" && (
              <div className="pt-2">
                <p className="text-[11px] text-muted-foreground mb-2">
                  Select specific students enrolled in this section:
                </p>
                {studentsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No students found in this section.
                  </p>
                ) : (
                  <div className="grid max-h-48 overflow-y-auto gap-2 rounded-2xl border border-border bg-surface p-3 sm:grid-cols-2">
                    {studentsList.map((st) => {
                      const isAssigned = (form.watch("assignedStudentIds") || []).includes(st.id);
                      return (
                        <label
                          key={st.id}
                          className="flex items-center gap-2 rounded-lg p-1.5 text-xs hover:bg-card cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={isAssigned}
                            onChange={(e) => {
                              const current = form.getValues("assignedStudentIds") || [];
                              if (e.target.checked) {
                                form.setValue("assignedStudentIds", [...current, st.id]);
                              } else {
                                form.setValue(
                                  "assignedStudentIds",
                                  current.filter((id) => id !== st.id)
                                );
                              }
                            }}
                            className="size-3.5 rounded text-primary"
                          />
                          <span className="font-semibold text-foreground">
                            {st.personal.fullName} ({st.rollNumber || "No Roll #"})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION F — GRADING */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              F. Evaluation & Grading Settings
            </h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                {...form.register("grading.enabled")}
                className="size-4 rounded text-primary"
              />
              Grade this assignment
            </label>

            {isGradingEnabled && (
              <div className="grid gap-4 sm:grid-cols-3 pt-2">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Maximum Marks *</Label>
                  <Input
                    type="number"
                    min={1}
                    {...form.register("grading.maximumMarks")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Passing Marks</Label>
                  <Input
                    type="number"
                    min={0}
                    {...form.register("grading.passingMarks")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.grading?.passingMarks && (
                    <p className="text-[11px] text-destructive">
                      {form.formState.errors.grading.passingMarks.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Grading Scale</Label>
                  <select
                    {...form.register("grading.gradeType")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="Marks">Marks / Score</option>
                    <option value="Grade">Letter Grade (A, B, C, F)</option>
                    <option value="Percentage">Percentage (%)</option>
                    <option value="Rubric">Rubric Evaluation</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION G — ACTIONS */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => navigate({ to: "/academic-work/assignments" })}
            className="rounded-xl text-xs"
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSaving}
            onClick={form.handleSubmit((d) => onSave(d, "draft"))}
            className="rounded-xl text-xs font-semibold"
          >
            {isSaving ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <Save className="size-3.5 mr-1.5" />}
            Save as Draft
          </Button>

          <Button
            type="button"
            variant="hero"
            size="sm"
            disabled={isSaving}
            onClick={form.handleSubmit((d) => onSave(d, "published"))}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSaving ? (
              <Loader2 className="size-4 animate-spin mr-1.5" />
            ) : (
              <Send className="size-3.5 mr-1.5" />
            )}
            Publish Assignment
          </Button>
        </div>
      </form>
    </div>
  );
};
