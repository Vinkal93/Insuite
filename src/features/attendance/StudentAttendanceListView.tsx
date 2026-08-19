import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarDays,
  AlertCircle,
  Edit,
  GraduationCap,
  Layers,
  Loader2,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getStudentAttendanceForDate,
  getSchoolClasses,
  getSections,
  updateSingleAttendanceStatus,
} from "@/services";
import type { AttendanceRecord, SchoolClass, Section, AttendanceStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const StudentAttendanceListView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [newStatus, setNewStatus] = useState<AttendanceStatus>("present");
  const [changeReason, setChangeReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [recs, classes, sections] = await Promise.all([
        getStudentAttendanceForDate(
          organization.id,
          selectedDate,
          selectedClassId !== "all" ? selectedClassId : undefined,
          selectedSectionId !== "all" ? selectedSectionId : undefined,
          selectedSession?.id
        ),
        getSchoolClasses(organization.id, selectedSession?.id),
        getSections(
          organization.id,
          selectedClassId !== "all" ? selectedClassId : undefined,
          selectedSession?.id
        ),
      ]);
      setRecords(recs);
      setClassesList(classes);
      setSectionsList(sections);
    } catch (err: any) {
      setError(err.message || "Failed to load student attendance");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedDate, selectedClassId, selectedSectionId, selectedSession]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !editingRecord) return;
    if (!changeReason.trim()) {
      setError("Please provide a reason for changing the attendance record.");
      return;
    }

    setIsUpdating(true);
    setSuccessMsg(null);
    try {
      await updateSingleAttendanceStatus(
        organization.id,
        editingRecord.id,
        newStatus,
        changeReason.trim(),
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );
      setSuccessMsg(`Attendance updated for ${editingRecord.personName}.`);
      setEditingRecord(null);
      setChangeReason("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update attendance");
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredRecords = records.filter((r) => {
    const matchesSearch =
      r.personName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.admissionNumber && r.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (r.rollNumber && r.rollNumber.includes(searchTerm));
    const matchesStatus = selectedStatus === "all" || r.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Student Attendance Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Daily roll call logs, attendance modifications, and audit logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-bold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/attendance/students/take">
              <Plus className="size-3.5 mr-1" /> Mark Class Attendance
            </Link>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student name, roll number, ID..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId("all");
            }}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Classes</option>
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
          </select>

          {/* Section Filter */}
          <select
            value={selectedSectionId}
            onChange={(e) => setSelectedSectionId(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Sections</option>
            {sectionsList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half_day">Half Day</option>
            <option value="leave">On Leave</option>
          </select>
        </div>
      </div>

      {/* Table & Mobile Responsive Cards */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading attendance records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">
              No attendance records found for {selectedDate}.
            </p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/attendance/students/take">+ Mark Roll Call for Today</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Student</th>
                  <th className="px-4 py-3.5 font-bold">Student ID</th>
                  <th className="px-4 py-3.5 font-bold">Class & Section</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Marked By</th>
                  <th className="px-4 py-3.5 font-bold">Marked At</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        {r.photoUrl ? (
                          <img src={r.photoUrl} alt={r.personName} className="size-8 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0">
                            {r.personName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <Link
                            to="/students/$studentId"
                            params={{ studentId: r.personId }}
                            className="hover:underline font-extrabold text-foreground"
                          >
                            {r.personName}
                          </Link>
                          <p className="text-[10px] text-muted-foreground font-mono">
                            Roll #{r.rollNumber || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-muted-foreground">
                      {r.admissionNumber || "—"}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {r.className} {r.sectionName ? `(${r.sectionName})` : ""}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          r.status === "present"
                            ? "bg-success/15 text-success"
                            : r.status === "absent"
                            ? "bg-rose-500/15 text-rose-500"
                            : r.status === "late"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-blue-500/15 text-blue-500"
                        }`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-medium">
                      {r.markedByName || "Admin"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-mono text-[11px]">
                      {new Date(r.markedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingRecord(r);
                          setNewStatus(r.status);
                          setChangeReason(r.changeReason || "");
                        }}
                        className="rounded-xl text-xs font-semibold"
                      >
                        <Edit className="size-3.5 mr-1" /> Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Attendance Modal */}
      {editingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Edit Attendance Record
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Modify attendance for <strong className="text-foreground">{editingRecord.personName}</strong> on {editingRecord.date}.
            </p>

            <form onSubmit={handleEditSubmit} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select New Status *</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as AttendanceStatus)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                  <option value="late">Late</option>
                  <option value="half_day">Half Day</option>
                  <option value="leave">On Leave</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Reason for Modification *</label>
                <textarea
                  required
                  rows={3}
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="e.g. Medical slip provided by parent, late arrival authorized by Principal..."
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingRecord(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isUpdating || !changeReason.trim()}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isUpdating ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Save Attendance
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
