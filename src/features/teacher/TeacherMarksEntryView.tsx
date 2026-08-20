import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  PenTool,
  ArrowLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  Award,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getExam, getMarksForSubject, saveMarksBulk } from "@/services/examService";
import { getClassStudents } from "@/services/academicService";
import type { Exam, StudentMarkEntry } from "@/types/exam";
import type { Student } from "@/types/student";
import { Button } from "@/components/ui/button";

export const TeacherMarksEntryView: React.FC = () => {
  const { examId } = useParams({ strict: false }) as { examId: string };
  const { organization, firebaseUser, userProfile } = useAuth();
  const { allocations, teacher } = useTeacher();

  const [exam, setExam] = useState<Exam | null>(null);
  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [marksMap, setMarksMap] = useState<Record<string, { marks: string; isAbsent: boolean; remarks: string }>>({});
  const [maxMarks, setMaxMarks] = useState<number>(100);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeClass = allocations.classes[selectedClassIndex];
  const classSubjects = allocations.subjects.filter(
    (s) => s.classId === activeClass?.classId && s.sectionId === activeClass?.sectionId
  );

  const loadExamAndStudents = async () => {
    if (!organization || !examId) return;
    setIsLoading(true);
    setError(null);
    try {
      const e = await getExam(organization.id, examId);
      setExam(e);

      if (activeClass) {
        const studentList = await getClassStudents(organization.id, activeClass.classId);
        setStudents(studentList);

        const subId = selectedSubjectId || (classSubjects[0]?.subjectId || "");
        if (subId) {
          const existingMarks = await getMarksForSubject(
            organization.id,
            examId,
            activeClass.classId,
            activeClass.sectionId,
            subId
          );

          const map: Record<string, { marks: string; isAbsent: boolean; remarks: string }> = {};
          studentList.forEach((s) => {
            const found = existingMarks.find((em) => em.studentId === s.id);
            map[s.id] = {
              marks: found?.marksObtained !== undefined ? String(found.marksObtained) : "",
              isAbsent: found?.isAbsent || false,
              remarks: found?.remarks || "",
            };
          });
          setMarksMap(map);
        }
      }
    } catch (err: any) {
      console.error("loadMarksEntry error:", err);
      setError(err.message || "Failed to load marks entry sheet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExamAndStudents();
  }, [organization, examId, activeClass, selectedSubjectId]);

  const handleMarkChange = (studentId: string, val: string) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: val, isAbsent: false },
    }));
  };

  const handleAbsentToggle = (studentId: string, isAbsent: boolean) => {
    setMarksMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], isAbsent, marks: isAbsent ? "0" : prev[studentId]?.marks || "" },
    }));
  };

  const handleSaveMarks = async () => {
    if (!organization || !exam || !activeClass || !firebaseUser) return;

    const sub = classSubjects.find((s) => s.subjectId === selectedSubjectId) || classSubjects[0];
    if (!sub) {
      alert("Please select a valid subject.");
      return;
    }

    setIsSaving(true);
    try {
      const entries: StudentMarkEntry[] = students.map((s) => {
        const current = marksMap[s.id] || { marks: "0", isAbsent: false, remarks: "" };
        const numMarks = Number(current.marks) || 0;

        return {
          studentId: s.id,
          studentName: s.fullName,
          rollNumber: s.academic.rollNumber || "",
          marksObtained: current.isAbsent ? 0 : numMarks,
          maxMarks,
          isAbsent: current.isAbsent,
          remarks: current.remarks,
        };
      });

      await saveMarksBulk(
        organization.id,
        exam.id,
        activeClass.classId,
        activeClass.sectionId,
        sub.subjectId,
        entries,
        { uid: firebaseUser.uid, name: userProfile?.name || teacher?.fullName || "Teacher" }
      );

      alert("Marks entered and saved successfully!");
      await loadExamAndStudents();
    } catch (err: any) {
      alert("Failed to save marks: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !exam) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error || "Exam not found."}</p>
        <Link
          to="/teacher/exams"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Return to Exams
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/teacher/exams"
            className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <span className="text-[10px] font-bold text-primary uppercase">{exam.name}</span>
            <h1 className="text-xl sm:text-2xl font-black text-foreground">Marks Entry Worksheet</h1>
          </div>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={handleSaveMarks}
          disabled={isSaving || students.length === 0}
          className="rounded-xl text-xs font-bold self-start sm:self-auto"
        >
          <Save className="size-3.5 mr-1.5" />
          {isSaving ? "Saving..." : "Save Marks Sheet"}
        </Button>
      </div>

      {/* Class & Subject Selector */}
      <div className="grid gap-4 sm:grid-cols-2 bg-card p-5 rounded-3xl border border-border shadow-soft">
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Class & Section</label>
          <select
            value={selectedClassIndex}
            onChange={(e) => setSelectedClassIndex(Number(e.target.value))}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {allocations.classes.map((cls, idx) => (
              <option key={idx} value={idx}>
                Class {cls.className} - {cls.sectionName}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-foreground mb-1.5">Subject</label>
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            {classSubjects.length === 0 ? (
              <option value="general">General Assessment</option>
            ) : (
              classSubjects.map((s) => (
                <option key={s.subjectId} value={s.subjectId}>
                  {s.subjectName}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Marks Sheet Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                <th className="py-3 px-4">Roll</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Marks Obtained (Max: {maxMarks})</th>
                <th className="py-3 px-4">Absent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium">
              {students.map((s) => {
                const current = marksMap[s.id] || { marks: "", isAbsent: false, remarks: "" };

                return (
                  <tr key={s.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {s.academic.rollNumber || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground">{s.fullName}</span>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        Adm: {s.admissionNumber}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max={maxMarks}
                        disabled={current.isAbsent}
                        value={current.marks}
                        onChange={(e) => handleMarkChange(s.id, e.target.value)}
                        placeholder="Marks"
                        className="w-24 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none disabled:opacity-40"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <label className="inline-flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={current.isAbsent}
                          onChange={(e) => handleAbsentToggle(s.id, e.target.checked)}
                          className="rounded border-border text-primary focus:ring-primary size-4"
                        />
                        <span className="text-[11px] text-muted-foreground font-semibold">Absent</span>
                      </label>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
