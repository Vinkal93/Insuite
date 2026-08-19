import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  Calendar,
  GraduationCap,
  Layers,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSchoolClasses,
  getSections,
  getSectionStudents,
  getStudentAttendanceHistory,
  getAcademicSessionsList,
  getTeachers,
  getStaffAttendanceForDate,
} from "@/services";
import type {
  SchoolClass,
  Section,
  Student,
  AcademicSessionItem,
  Teacher,
  StudentAttendanceSummary,
} from "@/types";
import { Button } from "@/components/ui/button";

export const AttendanceReportsView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [activeTab, setActiveTab] = useState<"class" | "student" | "staff">("class");

  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1); // 1st day of month
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("");

  const [summaries, setSummaries] = useState<StudentAttendanceSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Classes
  useEffect(() => {
    if (organization) {
      getSchoolClasses(organization.id, selectedSession?.id).then((cls) => {
        setClassesList(cls);
        if (cls.length > 0) {
          setSelectedClassId(cls[0].id);
        }
      });
    }
  }, [organization, selectedSession]);

  // Load Sections
  useEffect(() => {
    if (organization && selectedClassId) {
      getSections(organization.id, selectedClassId, selectedSession?.id).then((secs) => {
        setSectionsList(secs);
        if (secs.length > 0) {
          setSelectedSectionId(secs[0].id);
        } else {
          setSelectedSectionId("");
          setSummaries([]);
        }
      });
    }
  }, [organization, selectedClassId, selectedSession]);

  // Generate Report
  const generateReport = async () => {
    if (!organization || !selectedSectionId) return;
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch section students
      const students = await getSectionStudents(
        organization.id,
        selectedSectionId,
        selectedSession?.id
      );

      // 2. Fetch attendance history for each student in the date range in parallel
      const summaryResults = await Promise.all(
        students.map(async (st) => {
          const allRecs = await getStudentAttendanceHistory(
            organization.id,
            st.id,
            selectedSession?.id
          );
          // Filter by date range
          const filteredRecs = allRecs.filter(
            (r) => r.date >= startDate && r.date <= endDate
          );

          const totalDays = filteredRecs.length;
          const present = filteredRecs.filter((r) => r.status === "present").length;
          const absent = filteredRecs.filter((r) => r.status === "absent").length;
          const late = filteredRecs.filter((r) => r.status === "late").length;
          const leave = filteredRecs.filter(
            (r) => r.status === "leave" || r.status === "half_day"
          );

          const percentage =
            totalDays > 0 ? Math.round(((present + late) / totalDays) * 100) : 0;

          return {
            studentId: st.id,
            studentName: st.personal.fullName,
            rollNumber: st.academic.rollNumber,
            admissionNumber: st.admissionNumber,
            totalDays,
            present,
            absent,
            late,
            leave: leave.length,
            percentage,
            records: filteredRecs,
          };
        })
      );

      setSummaries(summaryResults);
    } catch (err: any) {
      setError(err.message || "Failed to generate attendance report");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSectionId) {
      generateReport();
    }
  }, [selectedSectionId, startDate, endDate]);

  const handleExportCSV = () => {
    if (summaries.length === 0) return;
    const headers = [
      "Roll No",
      "Student Name",
      "Admission ID",
      "Total Marked Days",
      "Present",
      "Absent",
      "Late",
      "Leave",
      "Attendance %",
    ];
    const rows = summaries.map((s) => [
      s.rollNumber || "",
      `"${s.studentName}"`,
      s.admissionNumber || "",
      s.totalDays,
      s.present,
      s.absent,
      s.late,
      s.leave,
      `${s.percentage}%`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `attendance_report_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Attendance Reports & Analytics
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Compute cumulative classroom presence rates, individual student breakdowns, and export data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCSV}
            disabled={summaries.length === 0}
            className="rounded-xl text-xs font-semibold"
          >
            <Download className="size-3.5 mr-1" /> Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="rounded-xl text-xs font-semibold"
          >
            <Printer className="size-3.5 mr-1" /> Print Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Parameters */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-4">
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold">From Date *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">To Date *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">Grade Level *</label>
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
            <label className="text-xs font-semibold">Classroom Section *</label>
            <select
              value={selectedSectionId}
              onChange={(e) => setSelectedSectionId(e.target.value)}
              disabled={sectionsList.length === 0}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
            >
              {sectionsList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Aggregate Statistics Report Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Computing attendance aggregates...</p>
          </div>
        ) : summaries.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileSpreadsheet className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No student attendance records in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Roll No</th>
                  <th className="px-4 py-3.5 font-bold">Student Name</th>
                  <th className="px-4 py-3.5 font-bold">Admission ID</th>
                  <th className="px-4 py-3.5 font-bold text-center">Total Marked Days</th>
                  <th className="px-4 py-3.5 font-bold text-center text-emerald-600">Present</th>
                  <th className="px-4 py-3.5 font-bold text-center text-rose-500">Absent</th>
                  <th className="px-4 py-3.5 font-bold text-center text-amber-500">Late</th>
                  <th className="px-4 py-3.5 font-bold text-center text-blue-500">Leave</th>
                  <th className="px-6 py-3.5 font-bold text-right">Attendance %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {summaries.map((s) => (
                  <tr key={s.studentId} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-foreground">
                      {s.rollNumber || "—"}
                    </td>
                    <td className="px-4 py-4 font-extrabold text-foreground">
                      {s.studentName}
                    </td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">
                      {s.admissionNumber || "—"}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-foreground">
                      {s.totalDays}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-emerald-600">
                      {s.present}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-rose-500">
                      {s.absent}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-amber-500">
                      {s.late}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-blue-500">
                      {s.leave}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-xs font-black ${
                          s.percentage >= 75
                            ? "bg-emerald-500/15 text-emerald-600"
                            : s.percentage >= 60
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-rose-500/15 text-rose-500"
                        }`}
                      >
                        {s.percentage}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
