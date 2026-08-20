import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Calendar,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getStaffAttendanceRecords } from "@/services/attendanceService";
import { listDepartments, listDesignations } from "@/services/hrService";
import type { AttendanceRecord } from "@/types/attendance";
import type { Department, Designation } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const StaffAttendanceView: React.FC = () => {
  const { organization } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  const loadAttendance = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [attData, deptData, desigData] = await Promise.all([
        getStaffAttendanceRecords(organization.id, selectedDate),
        listDepartments(organization.id),
        listDesignations(organization.id),
      ]);
      setRecords(attData);
      setDepartments(deptData);
      setDesignations(desigData);
    } catch (err: any) {
      console.error("Staff attendance load error:", err);
      setError(err.message || "Failed to load staff attendance records.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [organization, selectedDate]);

  const filteredRecords = records.filter((r) => {
    const matchesDept = selectedDept === "ALL" || r.department === selectedDept;
    const matchesStatus = selectedStatus === "ALL" || r.status === selectedStatus;
    return matchesDept && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "absent":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "late":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "half_day":
        return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "leave":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      default:
        return "bg-muted text-muted-foreground border-border";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Staff & Faculty Attendance
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Daily roll-call audit log, biometric records, and time-tracking.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/hr/attendance/take">
            <Plus className="size-3.5 mr-1.5" /> Take Staff Attendance
          </Link>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Date Picker */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Department Filter */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Department
            </label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1">
              Attendance Status
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="late">Late</option>
              <option value="half_day">Half Day</option>
              <option value="leave">On Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Attendance List */}
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
          <Button onClick={loadAttendance} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <ClipboardCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">
            No attendance marked for {selectedDate}
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Click "Take Staff Attendance" to record today's staff roster.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/hr/attendance/take">Record Attendance</Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Staff Member</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Marked At</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{r.personName}</td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">
                    {r.employeeId || "—"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.department || "General"}</td>
                  <td className="py-3 px-4 text-foreground font-medium">
                    {r.designation || "Staff"}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(
                        r.status
                      )}`}
                    >
                      {r.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.markedAt ? new Date(r.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—"}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{r.remarks || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
