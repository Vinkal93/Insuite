import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  UserCheck,
  AlertCircle,
  RefreshCw,
  Save,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getClassStudents } from "@/services/academicService";
import {
  getStudentAttendanceForDate,
  saveBulkStudentAttendance,
} from "@/services/attendanceService";
import type { Student } from "@/types/student";
import type { AttendanceStatus } from "@/types/attendance";
import { Button } from "@/components/ui/button";

export const TeacherAttendanceView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { allocations, teacher } = useTeacher();

  const [selectedClassIndex, setSelectedClassIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeClass = allocations.classes[selectedClassIndex];

  const loadAttendanceRoster = async () => {
    if (!organization || !activeClass) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const studentList = await getClassStudents(organization.id, activeClass.classId);
      const existingAttendance = await getStudentAttendanceForDate(
        organization.id,
        activeClass.classId,
        activeClass.sectionId,
        selectedDate
      );

      const map: Record<string, AttendanceStatus> = {};
      studentList.forEach((s) => {
        const found = existingAttendance.find((ea) => ea.studentId === s.id);
        map[s.id] = found ? found.status : "PRESENT";
      });

      setStudents(studentList);
      setAttendanceMap(map);
    } catch (err: any) {
      console.error("loadAttendanceRoster error:", err);
      setError(err.message || "Failed to load class roll call.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceRoster();
  }, [organization, activeClass, selectedDate]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleMarkAllPresent = () => {
    const map: Record<string, AttendanceStatus> = {};
    students.forEach((s) => {
      map[s.id] = "PRESENT";
    });
    setAttendanceMap(map);
  };

  const handleSaveAttendance = async () => {
    if (!organization || !activeClass || !firebaseUser) return;

    setIsSaving(true);
    try {
      const entries = students.map((s) => ({
        studentId: s.id,
        studentName: s.fullName,
        rollNumber: s.academic.rollNumber || "",
        status: attendanceMap[s.id] || "PRESENT",
      }));

      await saveBulkStudentAttendance(
        organization.id,
        {
          classId: activeClass.classId,
          className: activeClass.className,
          sectionId: activeClass.sectionId,
          sectionName: activeClass.sectionName,
          date: selectedDate,
          sessionId: students[0]?.academic.sessionId || "",
          entries,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || teacher?.fullName || "Teacher" }
      );

      alert("Attendance saved successfully!");
      await loadAttendanceRoster();
    } catch (err: any) {
      alert("Failed to save attendance: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (allocations.classes.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <CalendarCheck className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">No Classes Assigned</h2>
        <p className="mt-1 text-xs text-muted-foreground">You cannot mark attendance without assigned classes.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Take Class Attendance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Mark and verify daily student attendance for your assigned class.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {/* Class Selector Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {allocations.classes.map((cls, idx) => (
          <button
            key={idx}
            onClick={() => setSelectedClassIndex(idx)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedClassIndex === idx
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            Class {cls.className} - {cls.sectionName}
          </button>
        ))}
      </div>

      {/* Roster Controls */}
      <div className="flex items-center justify-between bg-card p-4 rounded-3xl border border-border shadow-soft">
        <div className="text-xs">
          <span className="font-bold text-foreground">{students.length} Students</span>
          <span className="text-muted-foreground"> in Class {activeClass?.className} ({activeClass?.sectionName})</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllPresent}
            className="rounded-xl text-xs font-bold"
          >
            Mark All Present
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={handleSaveAttendance}
            disabled={isSaving || students.length === 0}
            className="rounded-xl text-xs font-bold"
          >
            <Save className="size-3.5 mr-1.5" />
            {isSaving ? "Saving..." : "Save Attendance"}
          </Button>
        </div>
      </div>

      {/* Roster List */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadAttendanceRoster} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : students.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CalendarCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No students enrolled</h3>
          <p className="mt-1 text-xs text-muted-foreground">No students registered in this class.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {students.map((s) => {
            const currentStatus = attendanceMap[s.id] || "PRESENT";

            return (
              <div
                key={s.id}
                className="p-3.5 rounded-2xl border border-border bg-card shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                    {s.academic.rollNumber || "—"}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-foreground">{s.fullName}</h4>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Adm: {s.admissionNumber}
                    </p>
                  </div>
                </div>

                {/* Status Selector Buttons */}
                <div className="flex items-center gap-1.5 self-end sm:self-center">
                  {(["PRESENT", "ABSENT", "LATE", "LEAVE"] as AttendanceStatus[]).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => handleStatusChange(s.id, status)}
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold border transition-colors ${
                        currentStatus === status
                          ? status === "PRESENT"
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : status === "ABSENT"
                            ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                            : status === "LATE"
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-purple-600 text-white border-purple-600 shadow-sm"
                          : "bg-surface border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
