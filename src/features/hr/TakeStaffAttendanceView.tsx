import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listStaff } from "@/services/hrService";
import {
  getStaffAttendanceRecords,
  saveStaffAttendanceRecords,
} from "@/services/attendanceService";
import type { Staff } from "@/types/hr";
import type { AttendanceStatus } from "@/types/attendance";
import { Button } from "@/components/ui/button";

export const TakeStaffAttendanceView: React.FC = () => {
  const { organization, activeSession, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<
    Record<string, { status: AttendanceStatus; remarks?: string }>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!organization) return;
      setIsLoading(true);
      setError(null);
      try {
        const [activeStaff, existingRecords] = await Promise.all([
          listStaff(organization.id, { status: "Active" }),
          getStaffAttendanceRecords(organization.id, date),
        ]);

        setStaffList(activeStaff);

        const map: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
        // Default all to 'present' if not marked
        activeStaff.forEach((s) => {
          map[s.id] = { status: "present", remarks: "" };
        });
        // Override with existing
        existingRecords.forEach((r) => {
          map[r.personId] = { status: r.status, remarks: r.remarks || "" };
        });

        setAttendanceMap(map);
      } catch (err: any) {
        console.error("Take attendance load error:", err);
        setError(err.message || "Failed to load staff roster.");
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [organization, date]);

  const handleMarkAll = (status: AttendanceStatus) => {
    const updated: Record<string, { status: AttendanceStatus; remarks?: string }> = {};
    staffList.forEach((s) => {
      updated[s.id] = { status, remarks: attendanceMap[s.id]?.remarks || "" };
    });
    setAttendanceMap(updated);
  };

  const handleStatusChange = (staffId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staffId]: { ...prev[staffId], status },
    }));
  };

  const handleRemarksChange = (staffId: string, remarks: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [staffId]: { ...prev[staffId], remarks },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;

    const entries = staffList.map((st) => {
      const att = attendanceMap[st.id] || { status: "present" };
      return {
        personId: st.id,
        personName: st.fullName,
        employeeId: st.employeeId,
        department: st.professional.departmentName,
        designation: st.professional.designationName,
        status: att.status,
        remarks: att.remarks || undefined,
      };
    });

    setIsSubmitting(true);
    try {
      await saveStaffAttendanceRecords(
        organization.id,
        {
          date,
          academicSessionId: activeSession?.id || "default",
          entries,
        },
        firebaseUser.uid,
        userProfile?.name || "Admin"
      );

      navigate({ to: "/hr/attendance" });
    } catch (err: any) {
      console.error("Save attendance error:", err);
      alert("Failed to save attendance: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/hr/attendance">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Record Staff Attendance
            </h1>
            <p className="text-xs text-muted-foreground">
              Take roll-call for all active faculty and operational employees.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Quick Mark Toolbar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-bold text-foreground">
          Quick Mark All ({staffList.length} Staff):
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("present")}
            className="rounded-xl text-xs h-7 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20"
          >
            All Present
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("absent")}
            className="rounded-xl text-xs h-7 bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20"
          >
            All Absent
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("late")}
            className="rounded-xl text-xs h-7 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20"
          >
            All Late
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleMarkAll("leave")}
            className="rounded-xl text-xs h-7 bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20"
          >
            All Leave
          </Button>
        </div>
      </div>

      {/* Staff Roll-call Roster */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Department & Role</th>
                <th className="py-3 px-4">Attendance Status</th>
                <th className="py-3 px-4">Remarks (Optional)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {staffList.map((st) => {
                const currentStatus = attendanceMap[st.id]?.status || "present";
                return (
                  <tr key={st.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{st.fullName}</p>
                      <span className="font-mono text-[10px] text-primary font-bold">
                        {st.employeeId}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <p className="font-medium text-foreground">
                        {st.professional.designationName}
                      </p>
                      <p className="text-[10px]">{st.professional.departmentName}</p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(["present", "absent", "late", "half_day", "leave"] as AttendanceStatus[]).map(
                          (statusVal) => (
                            <button
                              key={statusVal}
                              type="button"
                              onClick={() => handleStatusChange(st.id, statusVal)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-bold capitalize transition-all border ${
                                currentStatus === statusVal
                                  ? statusVal === "present"
                                    ? "bg-emerald-500 text-white border-emerald-600"
                                    : statusVal === "absent"
                                    ? "bg-destructive text-white border-destructive"
                                    : statusVal === "late"
                                    ? "bg-amber-500 text-white border-amber-600"
                                    : statusVal === "half_day"
                                    ? "bg-purple-600 text-white border-purple-700"
                                    : "bg-blue-600 text-white border-blue-700"
                                  : "bg-surface border-border text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              {statusVal.replace("_", " ")}
                            </button>
                          )
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={attendanceMap[st.id]?.remarks || ""}
                        onChange={(e) => handleRemarksChange(st.id, e.target.value)}
                        placeholder="e.g. Late by 15 mins"
                        className="w-full rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/hr/attendance">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Saving Attendance Records..." : "Save Attendance Roster"}
          </Button>
        </div>
      </form>
    </div>
  );
};
