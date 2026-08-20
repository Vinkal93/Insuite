import React, { useState, useEffect } from "react";
import { Building2, Bed, Plane, Plus, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import {
  getStudentHostelRecord,
  listHostelLeaveRequests,
  createHostelLeaveRequest,
} from "@/services/hostelService";
import type { HostelAllocation, HostelLeaveRequest } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const StudentHostelView: React.FC = () => {
  const { organization } = useAuth();
  const { student } = useStudent();

  const [allocation, setAllocation] = useState<HostelAllocation | null>(null);
  const [leaves, setLeaves] = useState<HostelLeaveRequest[]>([]);
  const [isCreatingLeave, setIsCreatingLeave] = useState(false);

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
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [alloc, lList] = await Promise.all([
        getStudentHostelRecord(organization.id, student.id),
        listHostelLeaveRequests(organization.id, { studentId: student.id }),
      ]);
      setAllocation(alloc);
      setLeaves(lList);
      if (student.guardianPhone || student.fatherPhone || student.motherPhone) {
        setEmergencyContact(student.guardianPhone || student.fatherPhone || student.motherPhone || "");
      }
    } catch (err: any) {
      console.error("loadStudentHostel error:", err);
      setError(err.message || "Failed to load hostel data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, student]);

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !student || !allocation || !reason.trim() || !destination.trim() || !emergencyContact.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createHostelLeaveRequest(organization.id, {
        studentId: student.id,
        studentName: student.fullName,
        admissionNumber: student.admissionNumber,
        hostelId: allocation.hostelId,
        hostelName: allocation.hostelName,
        roomNumber: allocation.roomNumber,
        bedNumber: allocation.bedNumber,
        fromDate,
        toDate,
        reason: reason.trim(),
        destination: destination.trim(),
        emergencyContact: emergencyContact.trim(),
      });
      alert("Out-pass leave request submitted to warden.");
      setReason("");
      setDestination("");
      setIsCreatingLeave(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to submit leave: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          My Hostel & Residence
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Boarding house room assignment, bed details, and weekend out-pass leave requests.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-44 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : !allocation ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Building2 className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">Day Scholar / Not in Hostel</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            You do not have an active boarding house or hostel bed allocation.
          </p>
        </div>
      ) : (
        <>
          {/* Hostel Allotment Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Building2 className="size-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-foreground">{allocation.hostelName}</h2>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    Allotment Date: {allocation.allocationDate}
                  </span>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Active Resident
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 bg-surface/50 p-4 rounded-2xl border border-border text-xs font-mono">
              <div>
                <span className="text-muted-foreground text-[10px] block">ROOM NUMBER</span>
                <span className="font-bold text-base text-foreground">Room {allocation.roomNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">ASSIGNED BED</span>
                <span className="font-bold text-base text-primary">{allocation.bedNumber}</span>
              </div>
              <div>
                <span className="text-muted-foreground text-[10px] block">BOARDING STATUS</span>
                <span className="font-bold text-base text-emerald-600">Allotted</span>
              </div>
            </div>
          </div>

          {/* Out-pass Leave Requests Section */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-extrabold text-sm text-foreground">Out-Pass & Leave Requests</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Request permission for home visits, medical leaves, or weekend passes.
                </p>
              </div>

              <Button
                variant="hero"
                size="sm"
                onClick={() => setIsCreatingLeave(!isCreatingLeave)}
                className="rounded-xl text-xs font-bold self-start sm:self-auto"
              >
                <Plus className="size-3.5 mr-1" />
                {isCreatingLeave ? "Cancel" : "Apply for Leave Pass"}
              </Button>
            </div>

            {isCreatingLeave && (
              <form
                onSubmit={handleSubmitLeave}
                className="rounded-2xl border border-primary/30 bg-surface/50 p-5 space-y-3 text-xs"
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">From Date *</label>
                    <input
                      type="date"
                      required
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">To Date *</label>
                    <input
                      type="date"
                      required
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block font-semibold text-foreground mb-1">Destination *</label>
                    <input
                      type="text"
                      required
                      value={destination}
                      onChange={(e) => setDestination(e.target.value)}
                      placeholder="e.g. Home Address"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-foreground mb-1">Parent Contact *</label>
                    <input
                      type="tel"
                      required
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-foreground mb-1">Reason *</label>
                  <input
                    type="text"
                    required
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Family gathering / Medical checkup"
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
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
                    {isSubmitting ? "Submitting..." : "Submit to Warden"}
                  </Button>
                </div>
              </form>
            )}

            {leaves.length === 0 ? (
              <div className="text-center py-6 text-xs text-muted-foreground">
                No leave requests submitted yet.
              </div>
            ) : (
              <div className="space-y-2">
                {leaves.map((l) => (
                  <div
                    key={l.id}
                    className="p-3.5 rounded-2xl bg-surface/50 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div className="space-y-0.5">
                      <span className="font-bold text-foreground block">{l.reason}</span>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {l.fromDate} to {l.toDate} • Destination: {l.destination}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border self-start sm:self-auto ${
                        l.status === "Approved"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : l.status === "Rejected"
                          ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      }`}
                    >
                      {l.status}
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
