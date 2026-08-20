import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  AlertCircle,
  RefreshCw,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostels,
  listHostelAllocations,
  submitHostelAttendance,
  getHostelAttendanceByDate,
  listHostelLeaveRequests,
} from "@/services/hostelService";
import type { Hostel, HostelAllocation, HostelAttendanceRecord } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelAttendanceView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostelId, setSelectedHostelId] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);

  const [records, setRecords] = useState<HostelAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadAttendance = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const hList = await listHostels(organization.id);
      setHostels(hList);

      const activeHostelId = selectedHostelId || (hList.length > 0 ? hList[0].id : "");
      if (!activeHostelId) {
        setIsLoading(false);
        return;
      }
      setSelectedHostelId(activeHostelId);

      // Check existing attendance or generate from active allocations
      const [existing, allocs, leaves] = await Promise.all([
        getHostelAttendanceByDate(organization.id, activeHostelId, selectedDate),
        listHostelAllocations(organization.id, { hostelId: activeHostelId, status: "Active" }),
        listHostelLeaveRequests(organization.id, { status: "Approved" }),
      ]);

      if (existing) {
        setRecords(existing.records);
      } else {
        const approvedLeaveStudentIds = new Set(
          leaves
            .filter((l) => l.fromDate <= selectedDate && l.toDate >= selectedDate)
            .map((l) => l.studentId)
        );

        const initial: HostelAttendanceRecord[] = allocs.map((a) => ({
          studentId: a.studentId,
          studentName: a.studentName,
          admissionNumber: a.admissionNumber,
          roomNumber: a.roomNumber,
          bedNumber: a.bedNumber,
          status: approvedLeaveStudentIds.has(a.studentId) ? "Leave" : "Present",
          remarks: approvedLeaveStudentIds.has(a.studentId) ? "Approved Leave Pass" : "",
        }));
        setRecords(initial);
      }
    } catch (err: any) {
      console.error("loadHostelAttendance error:", err);
      setError(err.message || "Failed to load attendance.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAttendance();
  }, [organization, selectedHostelId, selectedDate]);

  const handleStatusChange = (index: number, status: "Present" | "Absent" | "Leave") => {
    setRecords((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], status };
      return copy;
    });
  };

  const handleSaveAttendance = async () => {
    if (!organization || !firebaseUser || !selectedHostelId) return;

    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await submitHostelAttendance(
        organization.id,
        {
          hostelId: selectedHostelId,
          date: selectedDate,
          records,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Warden" }
      );
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save attendance: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const presentCount = records.filter((r) => r.status === "Present").length;
  const absentCount = records.filter((r) => r.status === "Absent").length;
  const leaveCount = records.filter((r) => r.status === "Leave").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Night Roll Call
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Conduct daily residential attendance, curfew verification, and approved leave tracking.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={handleSaveAttendance}
          disabled={isSaving || records.length === 0}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Save className="size-3.5 mr-1.5" />
          {isSaving ? "Saving..." : "Submit Roll Call"}
        </Button>
      </div>

      {savedSuccess && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Hostel attendance saved successfully.
        </div>
      )}

      {/* Selectors & Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
          <label className="block text-[11px] font-bold text-muted-foreground">Select Hostel</label>
          <select
            value={selectedHostelId}
            onChange={(e) => setSelectedHostelId(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
          >
            {hostels.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name} ({h.type})
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-1">
          <label className="block text-[11px] font-bold text-muted-foreground">Roll Call Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center justify-around text-center">
          <div>
            <span className="text-[10px] text-muted-foreground font-bold block uppercase">Present</span>
            <span className="text-lg font-black text-emerald-600">{presentCount}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-[10px] text-muted-foreground font-bold block uppercase">Absent</span>
            <span className="text-lg font-black text-rose-600">{absentCount}</span>
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <span className="text-[10px] text-muted-foreground font-bold block uppercase">On Leave</span>
            <span className="text-lg font-black text-amber-600">{leaveCount}</span>
          </div>
        </div>
      </div>

      {/* Roster Table */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
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
      ) : records.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CalendarCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No students allocated to this hostel</h3>
          <p className="mt-1 text-xs text-muted-foreground">Allocate boarding students to begin roll call.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {records.map((r, idx) => (
                  <tr key={r.studentId} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{r.studentName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Adm: {r.admissionNumber || "N/A"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-semibold text-primary">
                      Rm {r.roomNumber} • {r.bedNumber}
                    </td>

                    <td className="py-3 px-4 text-center">
                      <div className="inline-flex rounded-2xl border border-border bg-surface p-0.5">
                        {(["Present", "Absent", "Leave"] as const).map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStatusChange(idx, st)}
                            className={`px-3 py-1 rounded-xl text-[10px] font-bold transition-colors ${
                              r.status === st
                                ? st === "Present"
                                  ? "bg-emerald-500 text-white shadow-sm"
                                  : st === "Absent"
                                  ? "bg-rose-500 text-white shadow-sm"
                                  : "bg-amber-500 text-white shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <input
                        type="text"
                        value={r.remarks || ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setRecords((prev) => {
                            const copy = [...prev];
                            copy[idx] = { ...copy[idx], remarks: val };
                            return copy;
                          });
                        }}
                        placeholder="e.g. In sick bay / Night study"
                        className="w-full rounded-xl border border-border bg-surface px-2.5 py-1 text-xs text-foreground focus:border-primary focus:outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
