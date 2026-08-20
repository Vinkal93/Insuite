import React, { useState, useEffect } from "react";
import { CalendarCheck, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { getStudentAttendanceSummary, getStudentAttendanceHistory } from "@/services/attendanceService";
import type { AttendanceRecord } from "@/types/attendance";
import { Button } from "@/components/ui/button";

export const StudentAttendanceView: React.FC = () => {
  const { organization } = useAuth();
  const { student } = useStudent();

  const [summary, setSummary] = useState<any | null>(null);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sessionId = student.academic.sessionId;
      const startDate = `${selectedMonth}-01`;
      const endDate = `${selectedMonth}-31`;

      const [sum, recs] = await Promise.all([
        getStudentAttendanceSummary(organization.id, student.id, sessionId),
        getStudentAttendanceHistory(organization.id, student.id, sessionId, startDate, endDate),
      ]);
      setSummary(sum);
      setRecords(recs);
    } catch (err: any) {
      console.error("loadAttendance error:", err);
      setError(err.message || "Failed to load attendance records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [organization, student, selectedMonth]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            My Attendance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Personal roll call logs, present/absent counts, and annual attendance rate.
          </p>
        </div>

        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
        />
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadAttendance} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Present Days</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">{summary?.presentDays || 0}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">
                of {summary?.totalDays || 0} days
              </span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Absent</span>
              <p className="text-2xl font-black text-rose-600 mt-1">{summary?.absentDays || 0}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Unexcused</span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Approved Leaves</span>
              <p className="text-2xl font-black text-amber-600 mt-1">{summary?.leaveDays || 0}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Excused</span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Overall %</span>
              <p className="text-2xl font-black text-primary mt-1">{summary ? `${summary.percentage}%` : "—"}</p>
              <span className="text-[10px] text-muted-foreground font-semibold">Session Avg</span>
            </div>
          </div>

          {/* Daily Logs Table */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">
              Daily Attendance ({selectedMonth})
            </h3>

            {records.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No attendance logs found for {selectedMonth}.
              </div>
            ) : (
              <div className="divide-y divide-border">
                {records.map((r) => (
                  <div key={r.id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-xl bg-surface flex items-center justify-center font-mono text-[11px] font-bold text-muted-foreground">
                        {r.date.split("-")[2]}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{r.date}</p>
                        {r.remarks && (
                          <p className="text-[10px] text-muted-foreground italic">{r.remarks}</p>
                        )}
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === "PRESENT"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : r.status === "ABSENT"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : r.status === "LATE"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-purple-500/10 text-purple-600 border-purple-500/20"
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
