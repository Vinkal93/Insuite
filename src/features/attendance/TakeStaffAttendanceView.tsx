import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  UserCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  Save,
  Loader2,
  AlertCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getTeachers,
  getStaffAttendanceForDate,
  saveBulkStaffAttendance,
  getAcademicSessionsList,
} from "@/services";
import type { Teacher, AttendanceStatus, AcademicSessionItem } from "@/types";
import { Button } from "@/components/ui/button";

interface StaffAttendanceEntry {
  teacher: Teacher;
  status: AttendanceStatus;
  remarks: string;
}

export const TakeStaffAttendanceView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [academicSessionId, setAcademicSessionId] = useState<string>(selectedSession?.id || "");
  const [sessionsList, setSessionsList] = useState<AcademicSessionItem[]>([]);
  const [entries, setEntries] = useState<StaffAttendanceEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadStaffAndAttendance = async () => {
    if (!organization) return;
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const [teachers, existingRecords, sessions] = await Promise.all([
        getTeachers(organization.id, "active"),
        getStaffAttendanceForDate(organization.id, date, selectedSession?.id),
        getAcademicSessionsList(organization.id),
      ]);

      setSessionsList(sessions);
      if (!academicSessionId && sessions.length > 0) {
        const activeSess = sessions.find((s) => s.isActive) || sessions[0];
        setAcademicSessionId(activeSess.id);
      }

      const existingMap = new Map(existingRecords.map((r) => [r.personId, r]));

      const initialEntries: StaffAttendanceEntry[] = teachers.map((t) => {
        const existing = existingMap.get(t.id);
        return {
          teacher: t,
          status: existing ? existing.status : "present",
          remarks: existing?.remarks || "",
        };
      });

      setEntries(initialEntries);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load faculty records");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadStaffAndAttendance();
  }, [organization, date, selectedSession]);

  const handleStatusChange = (teacherId: string, newStatus: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((item) => {
        if (item.teacher.id === teacherId) {
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    setEntries((prev) =>
      prev.map((item) => ({
        ...item,
        status,
      }))
    );
  };

  const handleSaveAttendance = async () => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await saveBulkStaffAttendance(
        organization.id,
        {
          date,
          academicSessionId: academicSessionId || selectedSession?.id || "",
          entries: entries.map((e) => ({
            personId: e.teacher.id,
            personName: e.teacher.personal.fullName,
            employeeId: e.teacher.employeeId,
            photoUrl: e.teacher.personal.photoUrl || null,
            status: e.status,
            remarks: e.remarks,
          })),
        },
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );

      setSuccessMsg(`Faculty attendance saved for ${entries.length} staff members.`);
    } catch (err: any) {
      console.error("Save staff attendance error:", err);
      setErrorMsg(err.message || "Failed to save staff attendance");
    } finally {
      setIsSaving(false);
    }
  };

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
            <Link to="/attendance/staff">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
              Mark Faculty Roll Call
            </h1>
            <p className="text-xs text-muted-foreground">
              Daily staff presence log with bulk actions and quick status toggles.
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
              if (confirm("Mark ALL faculty members as Absent?")) {
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

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Date & Session Bar */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 max-w-lg">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Attendance Date *</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Academic Session</label>
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
        </div>

        {/* Counter breakdown */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border text-xs">
          <span className="font-bold text-foreground">Total: {entries.length} Faculty</span>
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

      {/* Faculty List Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading faculty list...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No active teachers registered.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/academics/teachers/new">+ Add First Teacher</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Faculty Member</th>
                  <th className="px-4 py-3.5 font-bold">Employee ID</th>
                  <th className="px-4 py-3.5 font-bold">Department</th>
                  <th className="px-6 py-3.5 font-bold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((entry) => {
                  const t = entry.teacher;
                  return (
                    <tr key={t.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          {t.personal.photoUrl ? (
                            <img src={t.personal.photoUrl} alt={t.personal.fullName} className="size-8 rounded-xl object-cover shrink-0" />
                          ) : (
                            <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                              {t.personal.firstName.charAt(0)}
                            </div>
                          )}
                          <div>
                            <span className="font-extrabold text-foreground">{t.personal.fullName}</span>
                            <p className="text-[10px] text-muted-foreground">{t.professional.designation}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-mono font-bold text-primary">
                        {t.employeeId}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {t.professional.department || "General"}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="inline-flex items-center rounded-2xl border border-border bg-surface p-1 shadow-sm gap-1">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(t.id, "present")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "present"
                                ? "bg-emerald-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(t.id, "absent")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "absent"
                                ? "bg-rose-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Absent
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(t.id, "late")}
                            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              entry.status === "late"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            Late
                          </button>

                          <button
                            type="button"
                            onClick={() => handleStatusChange(t.id, "leave")}
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
          <span className="text-xs font-bold text-foreground">
            {presentCount} Present • {absentCount} Absent • {lateCount} Late • {leaveCount} Leave
          </span>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => navigate({ to: "/attendance/staff" })}
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
              Save Faculty Attendance
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
