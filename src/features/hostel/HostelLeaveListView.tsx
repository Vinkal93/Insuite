import React, { useState, useEffect } from "react";
import {
  Plane,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listHostelLeaveRequests,
  approveHostelLeaveRequest,
  rejectHostelLeaveRequest,
  createHostelLeaveRequest,
  listHostelAllocations,
} from "@/services/hostelService";
import type { HostelLeaveRequest, HostelAllocation } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelLeaveListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [leaves, setLeaves] = useState<HostelLeaveRequest[]>([]);
  const [allocations, setAllocations] = useState<HostelAllocation[]>([]);
  const [statusFilter, setStatusFilter] = useState("");

  // New leave request form
  const [isCreating, setIsCreating] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [fromDate, setFromDate] = useState(todayStr);
  const [toDate, setToDate] = useState(todayStr);
  const [reason, setReason] = useState("");
  const [destination, setDestination] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [lList, aList] = await Promise.all([
        listHostelLeaveRequests(organization.id, { status: statusFilter || undefined }),
        listHostelAllocations(organization.id, { status: "Active" }),
      ]);
      setLeaves(lList);
      setAllocations(aList);
      if (aList.length > 0 && !selectedStudentId) {
        setSelectedStudentId(aList[0].studentId);
      }
    } catch (err: any) {
      console.error("loadLeaves error:", err);
      setError(err.message || "Failed to load leave requests.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, statusFilter]);

  const handleApprove = async (leaveId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Approve this hostel leave request?")) return;

    try {
      await approveHostelLeaveRequest(organization.id, leaveId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Warden",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to approve: " + err.message);
    }
  };

  const handleReject = async (leaveId: string) => {
    const reason = prompt("Enter reason for leave rejection:");
    if (!reason || !organization || !firebaseUser) return;

    try {
      await rejectHostelLeaveRequest(organization.id, leaveId, reason, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Warden",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to reject: " + err.message);
    }
  };

  const handleCreateLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !selectedStudentId || !reason.trim() || !destination.trim() || !emergencyContact.trim()) {
      return;
    }

    const alloc = allocations.find((a) => a.studentId === selectedStudentId);
    if (!alloc) return;

    setIsSubmitting(true);
    try {
      await createHostelLeaveRequest(organization.id, {
        studentId: alloc.studentId,
        studentName: alloc.studentName,
        admissionNumber: alloc.admissionNumber,
        hostelId: alloc.hostelId,
        hostelName: alloc.hostelName,
        roomNumber: alloc.roomNumber,
        bedNumber: alloc.bedNumber,
        fromDate,
        toDate,
        reason: reason.trim(),
        destination: destination.trim(),
        emergencyContact: emergencyContact.trim(),
      });
      setReason("");
      setDestination("");
      setEmergencyContact("");
      setIsCreating(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to submit leave request: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Leave & Out-Pass Requests
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Authorize weekend out-passes, medical leaves, and home visits with parent contact logs.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsCreating(!isCreating)}
          className="rounded-2xl text-xs font-bold self-start sm:self-auto"
        >
          <Plus className="size-4 mr-1.5" />
          {isCreating ? "Cancel" : "Submit Leave Pass"}
        </Button>
      </div>

      {isCreating && (
        <form
          onSubmit={handleCreateLeave}
          className="rounded-3xl border border-primary/30 bg-card p-6 shadow-soft space-y-4 text-xs"
        >
          <h3 className="font-extrabold text-sm text-foreground">New Out-Pass / Leave Request</h3>

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className="block font-semibold text-foreground mb-1">Boarding Student *</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {allocations.map((a) => (
                  <option key={a.studentId} value={a.studentId}>
                    {a.studentName} ({a.hostelName} • Rm {a.roomNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">From Date *</label>
              <input
                type="date"
                required
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">To Date *</label>
              <input
                type="date"
                required
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="block font-semibold text-foreground mb-1">Destination Address / Home *</label>
              <input
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Home Address, New Delhi"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-foreground mb-1">Parent / Guardian Emergency Contact *</label>
              <input
                type="tel"
                required
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Reason for Leave *</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Sibling wedding / Medical consultation"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting || !reason.trim()}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? "Submitting..." : "Submit Leave Request"}
            </Button>
          </div>
        </form>
      )}

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Pending", "Approved", "Rejected"].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              statusFilter === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? `${st} Requests` : "All Requests"}
          </button>
        ))}
      </div>

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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : leaves.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Plane className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No leave passes recorded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Submitted student leave requests will appear here.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Room & Bed</th>
                  <th className="py-3 px-4">Leave Duration</th>
                  <th className="py-3 px-4">Reason & Destination</th>
                  <th className="py-3 px-4">Emergency Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {leaves.map((l) => (
                  <tr key={l.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{l.studentName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Adm: {l.admissionNumber || "N/A"}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono text-primary font-bold">
                      Rm {l.roomNumber} • {l.bedNumber}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {l.fromDate} to {l.toDate}
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground block">{l.reason}</span>
                      <span className="text-[10px] text-muted-foreground">{l.destination}</span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {l.emergencyContact}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          l.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : l.status === "Rejected"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {l.status === "Pending" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(l.id)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5 text-emerald-600 hover:bg-emerald-50"
                          >
                            <CheckCircle2 className="size-3 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(l.id)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2 text-rose-600 hover:bg-rose-50"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
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
