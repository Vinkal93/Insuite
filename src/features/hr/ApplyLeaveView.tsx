import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CalendarDays,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listStaff } from "@/services/hrService";
import { applyLeaveRequest } from "@/services/attendanceService";
import type { Staff } from "@/types/hr";
import type { LeaveType } from "@/types/attendance";
import { Button } from "@/components/ui/button";

export const ApplyLeaveView: React.FC = () => {
  const { organization, activeSession, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [leaveType, setLeaveType] = useState<LeaveType>("casual");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!organization) return;
      try {
        const staff = await listStaff(organization.id, { status: "Active" });
        setStaffList(staff);
        if (staff.length > 0) setSelectedStaffId(staff[0].id);
      } catch (err: any) {
        console.error("Load staff for leave error:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [organization]);

  // Compute Days
  const daysCount = Math.max(
    1,
    Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (new Date(endDate) < new Date(startDate)) {
      setError("End date must be on or after start date.");
      return;
    }
    if (!reason.trim()) {
      setError("Please specify the reason for leave.");
      return;
    }

    const staffMember = staffList.find((s) => s.id === selectedStaffId);
    if (!staffMember) {
      setError("Please select a valid staff member.");
      return;
    }

    setIsSubmitting(true);
    try {
      await applyLeaveRequest(organization.id, {
        academicSessionId: activeSession?.id || "default",
        applicantId: staffMember.id,
        applicantName: staffMember.fullName,
        applicantType: staffMember.professional.isTeachingStaff ? "teacher" : "staff",
        department: staffMember.professional.departmentName,
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });

      navigate({ to: "/hr/leave" });
    } catch (err: any) {
      console.error("Apply leave error:", err);
      setError(err.message || "Failed to submit leave request.");
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
          <Link to="/hr/leave">
            <ArrowLeft className="size-4 mr-1" /> Back
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
            Apply Staff Leave Request
          </h1>
          <p className="text-xs text-muted-foreground">
            Submit a formal time-off application for administrative approval.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Select Staff Member *
            </label>
            <select
              value={selectedStaffId}
              onChange={(e) => setSelectedStaffId(e.target.value)}
              required
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {staffList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.employeeId} - {s.professional.designationName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Leave Type *</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value as any)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="earned">Earned Leave</option>
              <option value="maternity">Maternity / Paternity Leave</option>
              <option value="unpaid">Unpaid Leave</option>
              <option value="other">Other Special Leave</option>
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Start Date *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">End Date *</label>
              <input
                type="date"
                required
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-3 text-xs flex items-center justify-between">
            <span className="text-muted-foreground">Calculated Duration:</span>
            <span className="font-bold text-primary">{daysCount} Day(s)</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Reason for Absence *
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="State the reason clearly for institutional record"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/hr/leave">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Submitting Application..." : "Submit Leave Application"}
          </Button>
        </div>
      </form>
    </div>
  );
};
