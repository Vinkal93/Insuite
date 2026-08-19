import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CalendarDays,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  Eye,
  Check,
  X,
  User,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { leaveRequestSchema, type LeaveRequestInput } from "@/schemas";
import {
  getLeaveRequests,
  createLeaveRequest,
  approveOrRejectLeaveRequest,
  getTeachers,
} from "@/services";
import type { LeaveRequest, LeaveStatus, Teacher } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const LeaveManagementView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const [activeTab, setActiveTab] = useState<LeaveStatus | "all">("pending");
  const [leavesList, setLeavesList] = useState<LeaveRequest[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Apply Leave Modal
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedApplicantId, setSelectedApplicantId] = useState("");
  const [isApplying, setIsApplying] = useState(false);

  // Approve / Reject Modal
  const [selectedLeave, setSelectedLeave] = useState<LeaveRequest | null>(null);
  const [actionType, setActionType] = useState<"approved" | "rejected">("approved");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const form = useForm<LeaveRequestInput>({
    resolver: zodResolver(leaveRequestSchema),
    defaultValues: {
      leaveType: "casual",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date().toISOString().split("T")[0],
      reason: "",
      attachmentUrl: null,
    },
  });

  const startDateVal = form.watch("startDate");
  const endDateVal = form.watch("endDate");

  const calculateDays = () => {
    if (!startDateVal || !endDateVal) return 1;
    const s = new Date(startDateVal);
    const e = new Date(endDateVal);
    const diff = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1);
    return isNaN(diff) ? 1 : diff;
  };

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [leaves, teachers] = await Promise.all([
        getLeaveRequests(organization.id, activeTab !== "all" ? activeTab : undefined),
        getTeachers(organization.id, "active"),
      ]);
      setLeavesList(leaves);
      setTeachersList(teachers);
    } catch (err: any) {
      setError(err.message || "Failed to load leave requests");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, activeTab]);

  const onApplySubmit = async (data: LeaveRequestInput) => {
    if (!organization || !firebaseUser) return;
    setIsApplying(true);
    setError(null);
    setSuccessMsg(null);

    try {
      let applicantName = userProfile?.displayName || "Faculty Member";
      let applicantRole = "Faculty";
      let applicantDept = "General";

      if (selectedApplicantId) {
        const found = teachersList.find((t) => t.id === selectedApplicantId);
        if (found) {
          applicantName = found.personal.fullName;
          applicantRole = found.professional.designation;
          applicantDept = found.professional.department;
        }
      }

      await createLeaveRequest(
        organization.id,
        data,
        selectedApplicantId || firebaseUser.uid,
        applicantName,
        "teacher",
        applicantRole,
        applicantDept,
        selectedSession?.id || ""
      );

      setSuccessMsg("Leave request submitted successfully.");
      setShowApplyModal(false);
      form.reset();
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to submit leave application");
    } finally {
      setIsApplying(false);
    }
  };

  const handleActionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedLeave) return;
    if (actionType === "rejected" && !rejectionReason.trim()) {
      setError("Please provide a reason for rejecting the leave request.");
      return;
    }

    setIsProcessing(true);
    setSuccessMsg(null);
    try {
      await approveOrRejectLeaveRequest(
        organization.id,
        selectedLeave.id,
        actionType,
        rejectionReason.trim() || undefined,
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );

      setSuccessMsg(`Leave request ${actionType} for ${selectedLeave.applicantName}.`);
      setSelectedLeave(null);
      setRejectionReason("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to process leave request");
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredLeaves = leavesList.filter((l) => {
    const matchesSearch =
      l.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.leaveType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const tabs: Array<{ id: LeaveStatus | "all"; label: string }> = [
    { id: "pending", label: "Pending Requests" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "all", label: "All Records" },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Leave Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Review, approve, and track staff leave applications. Approved leaves automatically reflect on attendance rosters.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setShowApplyModal(true)}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1" /> Apply for Leave
        </Button>
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm font-bold"
                  : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Search Toolbar */}
      <div className="flex rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by applicant name, reason, leave type..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading leave requests...</p>
          </div>
        ) : filteredLeaves.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <CalendarDays className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No leave requests found in this view.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowApplyModal(true)}
              className="mt-4 rounded-xl text-xs"
            >
              + Submit Leave Application
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Applicant</th>
                  <th className="px-4 py-3.5 font-bold">Leave Type</th>
                  <th className="px-4 py-3.5 font-bold">Duration</th>
                  <th className="px-4 py-3.5 font-bold text-center">Days</th>
                  <th className="px-4 py-3.5 font-bold">Reason</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLeaves.map((l) => (
                  <tr key={l.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div>
                        <p className="font-extrabold text-foreground">{l.applicantName}</p>
                        <p className="text-[10px] text-muted-foreground">{l.applicantRole || "Faculty"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[10px] font-bold capitalize">
                        {l.leaveType}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground font-semibold">
                      {l.startDate} to {l.endDate}
                    </td>
                    <td className="px-4 py-4 text-center font-black text-foreground">
                      <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                        {l.days} {l.days === 1 ? "Day" : "Days"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground max-w-xs truncate">
                      {l.reason}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          l.status === "approved"
                            ? "bg-success/15 text-success"
                            : l.status === "rejected"
                            ? "bg-rose-500/15 text-rose-500"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {l.status === "pending" ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLeave(l);
                              setActionType("approved");
                            }}
                            className="rounded-xl text-xs font-bold text-emerald-600 hover:bg-emerald-500/10"
                          >
                            <Check className="size-3.5 mr-1" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedLeave(l);
                              setActionType("rejected");
                            }}
                            className="rounded-xl text-xs font-bold text-rose-500 hover:bg-rose-500/10"
                          >
                            <X className="size-3.5 mr-1" /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {l.status === "approved" ? `By ${l.approvedByName || "Admin"}` : `Rejected: ${l.rejectionReason || "—"}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Submit Leave Application
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Fill in leave details. Days are automatically computed.
            </p>

            <form onSubmit={form.handleSubmit(onApplySubmit)} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Select Faculty Member (Optional)</Label>
                <select
                  value={selectedApplicantId}
                  onChange={(e) => setSelectedApplicantId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Myself ({userProfile?.displayName || "Admin"}) --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.personal.fullName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="leaveType" className="text-xs font-semibold">Leave Type *</Label>
                  <select
                    id="leaveType"
                    {...form.register("leaveType")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="casual">Casual Leave</option>
                    <option value="sick">Sick / Medical Leave</option>
                    <option value="earned">Earned / Annual Leave</option>
                    <option value="maternity">Maternity / Paternity</option>
                    <option value="unpaid">Leave Without Pay (LWP)</option>
                    <option value="other">Other Special Leave</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Computed Days</Label>
                  <div className="flex items-center rounded-xl border border-border bg-surface px-3 py-2 text-xs font-black text-primary">
                    {calculateDays()} Days
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="startDate" className="text-xs font-semibold">Start Date *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...form.register("startDate")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.startDate && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.startDate.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="endDate" className="text-xs font-semibold">End Date *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    {...form.register("endDate")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                  {form.formState.errors.endDate && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-semibold">Reason for Leave *</Label>
                <textarea
                  id="reason"
                  rows={3}
                  placeholder="e.g. Attending cousin's wedding, viral fever with doctor prescription..."
                  {...form.register("reason")}
                  className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {form.formState.errors.reason && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowApplyModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isApplying}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isApplying ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Submit Application
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approve / Reject Confirmation Modal */}
      {selectedLeave && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              {actionType === "approved" ? "Approve Leave Request" : "Reject Leave Request"}
            </h2>
            <div className="mt-3 rounded-2xl border border-border bg-surface p-3 text-xs space-y-1">
              <p className="font-bold text-foreground">Applicant: {selectedLeave.applicantName}</p>
              <p className="text-muted-foreground">Type: <span className="capitalize font-semibold text-foreground">{selectedLeave.leaveType}</span> • {selectedLeave.days} Days</p>
              <p className="text-muted-foreground">Dates: {selectedLeave.startDate} to {selectedLeave.endDate}</p>
              <p className="text-muted-foreground">Reason: "{selectedLeave.reason}"</p>
            </div>

            <form onSubmit={handleActionSubmit} className="mt-4 space-y-4">
              {actionType === "rejected" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-rose-500">Rejection Reason *</label>
                  <textarea
                    required
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide justification for rejecting this leave request..."
                    className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLeave(null)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isProcessing || (actionType === "rejected" && !rejectionReason.trim())}
                  className={`rounded-xl text-xs font-bold shadow-soft ${
                    actionType === "rejected" ? "bg-rose-600 hover:bg-rose-700 text-white" : ""
                  }`}
                >
                  {isProcessing ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Confirm {actionType === "approved" ? "Approval" : "Rejection"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
