import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Plus,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
} from "@/services/attendanceService";
import type { LeaveRequest, LeaveStatus } from "@/types/attendance";
import { Button } from "@/components/ui/button";

export const LeaveManagementView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [selectedTab, setSelectedTab] = useState<LeaveStatus | "all">("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadLeaves = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getLeaveRequests(organization.id);
      // Filter only staff / teacher applications
      setLeaves(data.filter((l) => l.applicantType !== "student"));
    } catch (err: any) {
      console.error("Leave requests load error:", err);
      setError(err.message || "Failed to load leave applications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [organization]);

  const filteredLeaves = leaves.filter((l) => {
    if (selectedTab === "all") return true;
    return l.status === selectedTab;
  });

  const handleApprove = async (leaveId: string) => {
    if (!organization || !firebaseUser) return;
    setProcessingId(leaveId);
    try {
      await approveLeaveRequest(
        organization.id,
        leaveId,
        firebaseUser.uid,
        userProfile?.name || "Admin"
      );
      await loadLeaves();
    } catch (err: any) {
      alert("Approval failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (leaveId: string) => {
    if (!organization || !firebaseUser) return;
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;

    setProcessingId(leaveId);
    try {
      await rejectLeaveRequest(
        organization.id,
        leaveId,
        firebaseUser.uid,
        userProfile?.name || "Admin",
        reason
      );
      await loadLeaves();
    } catch (err: any) {
      alert("Rejection failed: " + err.message);
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "rejected":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
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
            Staff Leave Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Review time-off requests, sick leaves, and authorized faculty leaves.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/hr/leave/new">
            <Plus className="size-3.5 mr-1.5" /> Apply Leave
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border overflow-x-auto pb-2 text-xs">
        {(["pending", "approved", "rejected", "cancelled", "all"] as (LeaveStatus | "all")[]).map(
          (tab) => {
            const count = leaves.filter((l) => (tab === "all" ? true : l.status === tab)).length;
            return (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-3 py-1.5 rounded-xl font-bold capitalize transition-all shrink-0 ${
                  selectedTab === tab
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab} ({count})
              </button>
            );
          }
        )}
      </div>

      {/* Leaves List */}
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
          <Button onClick={loadLeaves} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredLeaves.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <CalendarDays className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">
            No {selectedTab !== "all" ? selectedTab : ""} leave records
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            All submitted applications will be tracked here.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Leave Type</th>
                <th className="py-3 px-4">Period</th>
                <th className="py-3 px-4">Days</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-bold text-foreground">{leave.applicantName}</p>
                    <span className="text-[10px] text-muted-foreground">
                      {leave.department || "Staff Member"}
                    </span>
                  </td>
                  <td className="py-3 px-4 uppercase font-bold text-primary">
                    {leave.leaveType}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {leave.startDate} to {leave.endDate}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{leave.days} day(s)</td>
                  <td className="py-3 px-4 text-muted-foreground max-w-[200px] truncate">
                    "{leave.reason}"
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border capitalize ${getStatusBadge(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {leave.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={processingId === leave.id}
                          onClick={() => handleApprove(leave.id)}
                          className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10 font-bold"
                        >
                          Approve
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={processingId === leave.id}
                          onClick={() => handleReject(leave.id)}
                          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 font-bold"
                        >
                          Reject
                        </Button>
                      </div>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">
                        {leave.approvedByName ? `by ${leave.approvedByName}` : "—"}
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
  );
};
