import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  Edit3,
  Search,
  Filter,
  Save,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Loader2,
  UserCheck,
  UserX,
  ArrowLeft,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { Exam, ExamSubject, ExamMark } from "@/types/exams";
import type { SchoolClass, Section, Subject, Student } from "@/types";
import {
  listExams,
  getExam,
  getExamSubjects,
  getMarksForSubject,
  saveMarksBulk,
} from "@/services/examService";
import {
  getSchoolClasses,
  getSectionsByClass,
  getSubjectsByClass,
} from "@/services/academicService";
import { listStudents } from "@/services/studentService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface StudentMarkRow {
  studentId: string;
  studentName: string;
  studentIdentifier?: string;
  rollNumber?: string;
  marksObtained: number | string;
  absent: boolean;
  remarks: string;
  status?: string;
}

export const MarksEntryView: React.FC = () => {
  const { examId: initialExamId } = useParams({ strict: false }) as { examId?: string };
  const { organization, selectedSession, userProfile } = useAuth();

  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  // Selection states
  const [selectedExamId, setSelectedExamId] = useState<string>(initialExamId || "");
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  // Exam Subject Config
  const [currentExamSubject, setCurrentExamSubject] = useState<ExamSubject | null>(null);

  // Student Marks table state
  const [markRows, setMarkRows] = useState<StudentMarkRow[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  // Load initial dropdowns
  useEffect(() => {
    if (!organization) return;
    Promise.all([
      listExams(organization.id, { sessionId: selectedSession?.id }),
      getSchoolClasses(organization.id),
    ]).then(([exList, clsList]) => {
      setExams(exList);
      setClasses(clsList);
      if (!selectedExamId && exList.length > 0) {
        setSelectedExamId(exList[0].id);
      }
      if (clsList.length > 0) {
        setSelectedClassId(clsList[0].id);
      }
    });
  }, [organization, selectedSession]);

  // Load sections and subjects when class changes
  useEffect(() => {
    if (!organization || !selectedClassId) return;
    Promise.all([
      getSectionsByClass(organization.id, selectedClassId),
      getSubjectsByClass(organization.id, selectedClassId),
    ]).then(([secList, subList]) => {
      setSections(secList);
      setSubjects(subList);
      if (secList.length > 0) setSelectedSectionId(secList[0].id);
      if (subList.length > 0) setSelectedSubjectId(subList[0].id);
    });
  }, [organization, selectedClassId]);

  // Load students & existing marks
  const loadMarksData = async () => {
    if (!organization || !selectedExamId || !selectedClassId || !selectedSectionId || !selectedSubjectId) {
      setMarkRows([]);
      return;
    }

    setIsLoadingStudents(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    try {
      const [students, existingMarks, examSubjs] = await Promise.all([
        listStudents(organization.id, {
          classId: selectedClassId,
          sectionId: selectedSectionId,
          status: "ACTIVE",
        }),
        getMarksForSubject(
          organization.id,
          selectedExamId,
          selectedSubjectId,
          selectedClassId,
          selectedSectionId
        ),
        getExamSubjects(organization.id, selectedExamId, selectedClassId),
      ]);

      const foundSubject = examSubjs.find((s) => s.subjectId === selectedSubjectId);
      setCurrentExamSubject(foundSubject || null);

      const rows: StudentMarkRow[] = students.map((stud) => {
        const mark = existingMarks.find((m) => m.studentId === stud.id);
        return {
          studentId: stud.id,
          studentName: stud.fullName,
          studentIdentifier: stud.studentId,
          rollNumber: stud.academic?.rollNumber || "",
          marksObtained: mark && mark.marksObtained !== null && mark.marksObtained !== undefined ? mark.marksObtained : "",
          absent: mark ? mark.absent : false,
          remarks: mark?.remarks || "",
          status: mark ? mark.status : undefined,
        };
      });

      // Sort by roll number
      rows.sort((a, b) => {
        const rollA = parseInt(a.rollNumber || "0", 10);
        const rollB = parseInt(b.rollNumber || "0", 10);
        return rollA - rollB;
      });

      setMarkRows(rows);
    } catch (err: any) {
      console.error("Load marks error:", err);
      setSaveErrorMsg("Unable to load student marksheet.");
    } finally {
      setIsLoadingStudents(false);
    }
  };

  useEffect(() => {
    loadMarksData();
  }, [organization, selectedExamId, selectedClassId, selectedSectionId, selectedSubjectId]);

  const handleMarkChange = (index: number, val: string) => {
    const maxMarks = currentExamSubject?.maximumMarks || 100;
    const num = val === "" ? "" : Number(val);

    if (num !== "" && (num < 0 || num > maxMarks)) {
      // Ignore out of bounds
      return;
    }

    setMarkRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, marksObtained: num, absent: false } : row))
    );
  };

  const handleAbsentToggle = (index: number, checked: boolean) => {
    setMarkRows((prev) =>
      prev.map((row, i) =>
        i === index
          ? {
              ...row,
              absent: checked,
              marksObtained: checked ? "" : row.marksObtained,
            }
          : row
      )
    );
  };

  const handleRemarksChange = (index: number, remarks: string) => {
    setMarkRows((prev) =>
      prev.map((row, i) => (i === index ? { ...row, remarks } : row))
    );
  };

  const handleSaveMarks = async () => {
    if (!organization || !userProfile || !selectedExamId || !selectedSubjectId || markRows.length === 0) return;

    setIsSaving(true);
    setSaveErrorMsg(null);
    setSaveSuccessMsg(null);

    const maxMarks = currentExamSubject?.maximumMarks || 100;

    try {
      const payload = {
        examId: selectedExamId,
        examSubjectId: currentExamSubject?.id || `exam_${selectedExamId}_cls_${selectedClassId}_subj_${selectedSubjectId}`,
        subjectId: selectedSubjectId,
        classId: selectedClassId,
        sectionId: selectedSectionId,
        maximumMarks: maxMarks,
        entries: markRows.map((r) => ({
          studentId: r.studentId,
          studentName: r.studentName,
          rollNumber: r.rollNumber,
          marksObtained: r.absent || r.marksObtained === "" ? null : Number(r.marksObtained),
          absent: r.absent,
          remarks: r.remarks,
        })),
      };

      await saveMarksBulk(organization.id, payload, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Teacher",
      });

      setSaveSuccessMsg(`Marks for ${markRows.length} students saved successfully!`);
      // Update status tags locally
      setMarkRows((prev) => prev.map((r) => ({ ...r, status: "Entered" })));
    } catch (err: any) {
      console.error("Save marks error:", err);
      setSaveErrorMsg(err.message || "Marks could not be saved. Your entered values are preserved; please retry.");
    } finally {
      setIsSaving(false);
    }
  };

  const enteredCount = markRows.filter((r) => r.absent || r.marksObtained !== "").length;
  const maxMarks = currentExamSubject?.maximumMarks || 100;
  const passMarks = currentExamSubject?.passingMarks || 33;

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Marks Entry Workspace
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Record subject-wise marks, log absentees, and verify student assessment scores.
          </p>
        </div>

        {initialExamId && (
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/exams/$examId" params={{ examId: initialExamId }}>
              <ArrowLeft className="size-3.5 mr-1.5" /> Back to Exam
            </Link>
          </Button>
        )}
      </div>

      {/* Filter Ribbon */}
      <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:grid-cols-2 lg:grid-cols-4">
        {/* Exam */}
        <div className="space-y-1">
          <Label htmlFor="examSel" className="text-xs font-semibold">
            Exam:
          </Label>
          <select
            id="examSel"
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.name} ({ex.type})
              </option>
            ))}
          </select>
        </div>

        {/* Class */}
        <div className="space-y-1">
          <Label htmlFor="clsSel" className="text-xs font-semibold">
            Class:
          </Label>
          <select
            id="clsSel"
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Section */}
        <div className="space-y-1">
          <Label htmlFor="secSel" className="text-xs font-semibold">
            Section:
          </Label>
          <select
            id="secSel"
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subject */}
        <div className="space-y-1">
          <Label htmlFor="subSel" className="text-xs font-semibold">
            Subject:
          </Label>
          <select
            id="subSel"
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            {subjects.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Subject Info & Progress Card */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border bg-surface/50 p-4">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-primary/10 p-2 text-primary">
            <GraduationCap className="size-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-foreground">
                Max Marks: <strong className="text-primary">{maxMarks}</strong>
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs font-semibold text-muted-foreground">
                Passing Marks: <strong className="text-foreground">{passMarks}</strong>
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Marks Progress: <strong>{enteredCount}</strong> of <strong>{markRows.length}</strong> students entered
            </p>
          </div>
        </div>

        <Button
          onClick={handleSaveMarks}
          disabled={isSaving || markRows.length === 0}
          variant="hero"
          size="sm"
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          {isSaving ? (
            <>
              <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving Marks...
            </>
          ) : (
            <>
              <Save className="size-3.5 mr-1.5" /> Save Marks Sheet
            </>
          )}
        </Button>
      </div>

      {/* Success / Error Banners */}
      {saveSuccessMsg && (
        <div className="flex items-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-3.5 text-xs text-emerald-600">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive">
          <div className="flex items-center gap-2">
            <AlertCircle className="size-4 shrink-0" />
            <span>{saveErrorMsg}</span>
          </div>
          <Button onClick={handleSaveMarks} variant="outline" size="sm" className="h-7 text-[11px]">
            Retry
          </Button>
        </div>
      )}

      {/* Students Table / Marks Input */}
      {isLoadingStudents ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-14 animate-pulse rounded-2xl bg-secondary/80 border border-border/50" />
          ))}
        </div>
      ) : markRows.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center space-y-2">
          <UserX className="size-8 mx-auto text-muted-foreground/60" />
          <h3 className="text-sm font-bold text-foreground">No students enrolled</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No active students found in this class and section.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 font-bold uppercase tracking-wider text-muted-foreground text-[10px]">
                <tr>
                  <th className="px-4 py-3 w-16">Roll</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Student ID</th>
                  <th className="px-4 py-3 w-36">Marks (Max: {maxMarks})</th>
                  <th className="px-4 py-3 w-28 text-center">Absent</th>
                  <th className="px-4 py-3">Remarks</th>
                  <th className="px-4 py-3 w-24">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {markRows.map((row, idx) => (
                  <tr key={row.studentId} className="hover:bg-surface/30 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-foreground">{row.rollNumber || idx + 1}</td>
                    <td className="px-4 py-3 font-bold text-foreground">{row.studentName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-muted-foreground">
                      {row.studentIdentifier || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="number"
                        min={0}
                        max={maxMarks}
                        placeholder="0"
                        disabled={row.absent}
                        value={row.marksObtained}
                        onChange={(e) => handleMarkChange(idx, e.target.value)}
                        className={`h-8 w-28 rounded-lg text-xs font-bold ${
                          row.absent ? "bg-muted/50 text-muted-foreground" : "bg-surface"
                        }`}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        id={`absent-${row.studentId}`}
                        checked={row.absent}
                        onCheckedChange={(c) => handleAbsentToggle(idx, !!c)}
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Input
                        type="text"
                        placeholder="Optional remarks"
                        value={row.remarks}
                        onChange={(e) => handleRemarksChange(idx, e.target.value)}
                        className="h-8 rounded-lg text-xs"
                      />
                    </td>
                    <td className="px-4 py-3">
                      {row.absent ? (
                        <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive">
                          Absent
                        </span>
                      ) : row.marksObtained !== "" ? (
                        <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                          Entered
                        </span>
                      ) : (
                        <span className="rounded-md bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-600">
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between p-4 border-t border-border bg-surface/30">
            <span className="text-xs text-muted-foreground">
              Total Students: <strong className="text-foreground">{markRows.length}</strong>
            </span>
            <Button
              onClick={handleSaveMarks}
              disabled={isSaving || markRows.length === 0}
              variant="hero"
              size="sm"
              className="rounded-xl text-xs font-bold"
            >
              {isSaving ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Saving Marks...
                </>
              ) : (
                <>
                  <Save className="size-3.5 mr-1.5" /> Save Marks Sheet
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
