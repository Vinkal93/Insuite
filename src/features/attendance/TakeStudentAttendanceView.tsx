import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  ClipboardCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Users,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSchoolClasses,
  getSections,
  getSectionStudents,
  getStudentAttendanceForDate,
  saveBulkStudentAttendance,
  getAcademicSessionsList,
} from "@/services";
import type {
  SchoolClass,
  Section,
  Student,
  AttendanceStatus,
  AcademicSessionItem,
} from "@/types";
import { Button } from "@/components/ui/button";

interface StudentAttendanceEntry {
  student: Student;
  status: AttendanceStatus;
  remarks: string;
  isDirty?: boolean;
}

export const TakeStudentAttendanceView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [academicSessionId, setAcademicSessionId] = useState<string>(selectedSession?.id || "");
  const [sessionsList, setSessionsList] = useState<AcademicSessionItem[]>([]);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [entries, setEntries] = useState<StudentAttendanceEntry[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Classes & Sessions
  useEffect(() => {
    if (organization) {
      Promise.all([
        getSchoolClasses(organization.id, selectedSession?.id),
        getAcademicSessionsList(organization.id),
      ]).then(([classes, sess]) => {
        setClassesList(classes);
        setSessionsList(sess);
        if (!academicSessionId && sess.length > 0) {
          const activeSess = sess.find((s) => s.isActive) || sess[0];
          setAcademicSessionId(activeSess.id);
        }
        if (classes.length > 0 && !selectedClassId) {
          setSelectedClassId(classes[0].id);
        }
      });
    }
  }, [organization, selectedSession]);

  // Load Sections when Class changes
  useEffect(() => {
    if (organization && selectedClassId) {
      getSections(organization.id, selectedClassId, academicSessionId).then((secs) => {
        setSectionsList(secs);
        if (secs.length > 0) {
          setSelectedSectionId(secs[0].id);
        } else {
          setSelectedSectionId("");
          setEntries([]);
        }
      });
    }
  }, [organization, selectedClassId, academicSessionId]);

  // Load Students for Selected Section & Existing Attendance
  const loadClassStudentsAndAttendance = useCallback(async () => {
    if (!organization || !selectedSectionId) return;
    setIsLoadingStudents(true);
    setSaveError(null);
    setSuccessMsg(null);
    try {
      // 1. Efficient server query: load ONLY students belonging to this class & section
      const students = await getSectionStudents(
        organization.id,
        selectedSectionId,
        academicSessionId
      );

      // 2. Query existing attendance for this date
      const existingRecords = await getStudentAttendanceForDate(
        organization.id,
        date,
        selectedClassId,
        selectedSectionId,
        academicSessionId
      );

      const existingMap = new Map(existingRecords.map((r) => [r.personId, r]));

      const initialEntries: StudentAttendanceEntry[] = students.map((st) => {
        const existing = existingMap.get(st.id);
        return {
          student: st,
          status: existing ? existing.status : "present",
          remarks: existing?.remarks || "",
          isDirty: false,
        };
      });

      setEntries(initialEntries);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      setSaveError(err.message || "Failed to load classroom roll call");
    } finally {
      setIsLoadingStudents(false);
    }
  }, [organization, selectedSectionId, selectedClassId, academicSessionId, date]);

  useEffect(() => {
    if (selectedSectionId) {
      loadClassStudentsAndAttendance();
    }
  }, [selectedSectionId, date, loadClassStudentsAndAttendance]);

  // Keyboard Shortcuts (P = Present, A = Absent, L = Late)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if active element is not an input or textarea
      if (
        document.activeElement instanceof HTMLInputElement ||
        document.activeElement instanceof HTMLTextAreaElement ||
        document.activeElement instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.key === "p" || e.key === "P") {
        handleMarkAll("present");
      } else if (e.key === "a" || e.key === "A") {
        if (confirm("Mark ALL students as Absent?")) {
          handleMarkAll("absent");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entries]);

  const handleStatusChange = (studentId: string, newStatus: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((item) => {
        if (item.student.id === studentId) {
          return { ...item, status: newStatus, isDirty: true };
        }
        return item;
      })
    );
    setHasUnsavedChanges(true);
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((item) => ({
        ...item,
        status,
        isDirty: true,
      }))
    );
    setHasUnsavedChanges(true);
  };

  const handleSaveAttendance = async () => {
    if (!organization || !firebaseUser || !selectedClassId || !selectedSectionId) return;
    setIsSaving(true);
    setSaveError(null);
    setSuccessMsg(null);

    try {
      await saveBulkStudentAttendance(
        organization.id,
        {
          date,
          academicSessionId,
          classId: selectedClassId,
          sectionId: selectedSectionId,
          entries: entries.map((e) => ({
            personId: e.student.id,
            personName: e.student.personal.fullName,
            rollNumber: e.student.academic.rollNumber || "",
            admissionNumber: e.student.admissionNumber,
            photoUrl: e.student.documents?.profilePhotoUrl || null,
            status: e.status,
            remarks: e.remarks,
          })),
        },
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );

      setSuccessMsg(`Attendance saved successfully for ${entries.length} students.`);
      setHasUnsavedChanges(false);
    } catch (err: any) {
      console.error("Save attendance error:", err);
      setSaveError(
        err.message || "Attendance could not be saved due to network error. Click Retry to re-attempt."
      );
    } finally {
      setIsSaving(false);
    }
  };

  // Summary counts
  const presentCount = entries.filter((e) => e.status === "present").length;
  const absentCount = entries.filter((e) => e.status === "absent").length;
  const lateCount = entries.filter((e) => e.status === "late").length;
  const leaveCount = entries.filter((e) => e.status === "leave" || e.status === "half_day").length;

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/attendance/students">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Take Student Roll Call
            </h1>
            <p className="text-xs text-muted-foreground">
              Mark daily attendance by class and section with instant keyboard shortcuts (P = Present, A = Absent).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("present")}
            className="rounded-xl text-xs font-semibold"
          >
            <CheckCircle2 className="size-3.5 mr-1 text-emerald-600" /> Mark All Present
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (confirm("Are you sure you want to mark ALL students as Absent?")) {
                handleMarkAll("absent");
              }
            }}
            className="rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
          >
            <XCircle className="size-3.5 mr-1" /> Mark All Absent
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {saveError && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{saveError}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveAttendance}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            Retry
          </Button>
        </div>
      )}

      {/* Classroom Selection Control Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Roll Call Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Academic Session *</label>
            <select
              value={academicSessionId}
              onChange={(e) => setAcademicSessionId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {sessionsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Select Class *</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {classesList.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Select Section *</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={sectionsList.length === 0}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {sectionsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code}) - Cap: {s.capacity}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Live Counters */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border text-xs">
          <span className="font-bold text-foreground">Total: {entries.length} Students</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-bold text-emerald-600">{presentCount} Present</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-bold text-rose-500">{absentCount} Absent</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-bold text-amber-500">{lateCount} Late</span>
          <span className="text-muted-foreground">•</span>
          <span className="font-bold text-blue-500">{leaveCount} Leave</span>
        </div>
      </div>

      {/* Student Roster Table & Responsive Cards */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoadingStudents ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs font-semibold">Loading students for this class and section...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No students enrolled in this section.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/students/new">+ Enroll Students</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Roll No</th>
                  <th className="px-4 py-3.5 font-bold">Student Name</th>
                  <th className="px-4 py-3.5 font-bold">Admission ID</th>
                  <th className="px-6 py-3.5 font-bold text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => {
                  const st = entry.student;
                  return (
                    <tr key={st.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-foreground">
                        {st.academic.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          {st.documents?.profilePhotoUrl ? (
                            <img
                              src={st.documents.profilePhotoUrl}
                              alt={st.personal.fullName}
                              className="size-8 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                              {st.personal.firstName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-foreground">{st.personal.fullName}</span>
                            <p className="text-[10px] text-muted-foreground capitalize">{st.personal.gender}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono text-muted-foreground">
                        {st.admissionNumber}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center rounded-2xl border border-border bg-surface p-1 shadow-sm gap-1">
                          {/* Present Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, "present")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "present"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Present
                          </button>

                          {/* Absent Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, "absent")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "absent"
                                ? "bg-rose-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Absent
                          </button>

                          {/* Late Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, "late")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "late"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Late
                          </button>

                          {/* Leave Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, "leave")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "leave"
                                ? "bg-blue-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Leave
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Sticky Bottom Save Action Bar */}
      {entries.length > 0 && (
        <div className="sticky bottom-4 z-40 rounded-3xl border border-border bg-card/95 p-4 shadow-lift backdrop-blur-md flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-foreground">
              {presentCount} Present • {absentCount} Absent • {lateCount} Late
            </span>
            {hasUnsavedChanges && (
              <span className="rounded-full bg-amber-500/10 text-amber-600 px-2 py-0.5 text-[10px] font-bold">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                if (hasUnsavedChanges && !confirm("Discard unsaved attendance changes?")) return;
                navigate({ to: "/attendance/students" });
              }}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="hero"
              disabled={isSaving}
              onClick={handleSaveAttendance}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-3.5 mr-1.5" />}
              Save Attendance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
