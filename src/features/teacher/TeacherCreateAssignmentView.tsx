import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, BookOpen, Save, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { createAssignment } from "@/services/academicWorkService";
import { Button } from "@/components/ui/button";

export const TeacherCreateAssignmentView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();
  const { allocations, teacher } = useTeacher();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [totalMarks, setTotalMarks] = useState("20");
  const [assignedDate, setAssignedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split("T")[0];
  });
  const [allowSubmission, setAllowSubmission] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activeClass = allocations.classes[selectedClassIndex];
  const classSubjects = allocations.subjects.filter(
    (s) => s.classId === activeClass?.classId && s.sectionId === activeClass?.sectionId
  );

  const handleSubmit = async (e: React.FormEvent, status: "DRAFT" | "PUBLISHED") => {
    e.preventDefault();
    if (!organization || !firebaseUser || !activeClass) return;

    if (dueDate < assignedDate) {
      alert("Due date cannot be earlier than assigned date.");
      return;
    }

    const sub = classSubjects.find((s) => s.subjectId === selectedSubjectId) || classSubjects[0];

    setIsSubmitting(true);
    try {
      await createAssignment(
        organization.id,
        {
          title: title.trim(),
          description: description.trim(),
          sessionId: "", // Will auto-resolve
          classId: activeClass.classId,
          className: activeClass.className,
          sectionId: activeClass.sectionId,
          sectionName: activeClass.sectionName,
          subjectId: sub ? sub.subjectId : "gen",
          subjectName: sub ? sub.subjectName : "General",
          type: "HOMEWORK",
          status,
          assignedDate,
          dueDate,
          totalMarks: Number(totalMarks) || 20,
          allowOnlineSubmission: allowSubmission,
          isGraded: true,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || teacher?.fullName || "Teacher" }
      );

      alert(`Assignment ${status === "PUBLISHED" ? "published" : "saved as draft"} successfully!`);
      navigate({ to: "/teacher/assignments" });
    } catch (err: any) {
      alert("Failed to create assignment: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/teacher/assignments"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Create Assignment</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Assign homework or coursework to your allocated class.
          </p>
        </div>
      </div>

      <form className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
        {/* Class Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">
            Target Class & Section *
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {allocations.classes.map((cls, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSelectedClassIndex(idx);
                  setSelectedSubjectId("");
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedClassIndex === idx
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                Class {cls.className} - {cls.sectionName}
              </button>
            ))}
          </div>
        </div>

        {/* Subject Selection */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Subject *</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {classSubjects.length === 0 ? (
              <option value="general">General Classwork</option>
            ) : (
              classSubjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectName}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Assignment Title */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Assignment Title *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Chapter 4 Trigonometry Problem Set"
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Description / Instructions */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">
            Instructions & Rubric *
          </label>
          <textarea
            rows={4}
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Detailed instructions, textbook page numbers, and grading criteria..."
            className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Dates & Marks Grid */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Assigned Date</label>
            <input
              type="date"
              value={assignedDate}
              onChange={(e) => setAssignedDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Due Date *</label>
            <input
              type="date"
              required
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Max Marks *</label>
            <input
              type="number"
              required
              min="1"
              max="100"
              value={totalMarks}
              onChange={(e) => setTotalMarks(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono font-bold"
            />
          </div>
        </div>

        {/* Online Submission Toggle */}
        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="allowSubmission"
            checked={allowSubmission}
            onChange={(e) => setAllowSubmission(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary size-4"
          />
          <label htmlFor="allowSubmission" className="text-xs font-semibold text-foreground cursor-pointer">
            Allow students to upload online file submissions
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, "DRAFT")}
            className="rounded-xl text-xs font-bold"
          >
            <Save className="size-3.5 mr-1.5" /> Save as Draft
          </Button>

          <Button
            type="button"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !title.trim()}
            onClick={(e) => handleSubmit(e, "PUBLISHED")}
            className="rounded-xl text-xs font-bold"
          >
            <Send className="size-3.5 mr-1.5" /> Publish Assignment
          </Button>
        </div>
      </form>
    </div>
  );
};
