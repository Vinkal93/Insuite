import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  GraduationCap,
  Briefcase,
  CalendarCheck,
  CalendarX,
  Clock,
  AlertTriangle,
  Plus,
  RefreshCw,
  AlertCircle,
  Building2,
  FileText,
  CreditCard,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getHrDashboardStats,
  listStaff,
  listDepartments,
} from "@/services/hrService";
import { getPendingLeaveRequests, approveLeaveRequest, rejectLeaveRequest } from "@/services/attendanceService";
import type { HrDashboardStats, Staff, Department } from "@/types/hr";
import type { LeaveRequest } from "@/types/attendance";
import { Button } from "@/components/ui/button";

export const HrDashboardView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [stats, setStats] = useState<HrDashboardStats | null>(null);
  const [recentStaff, setRecentStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [pendingLeaves, setPendingLeaves] = useState<LeaveRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingLeaveId, setProcessingLeaveId] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [st, staffList, deptList, leaves] = await Promise.all([
        getHrDashboardStats(organization.id),
        listStaff(organization.id),
        listDepartments(organization.id),
        getPendingLeaveRequests(organization.id).catch(() => []),
      ]);
      setStats(st);
      setRecentStaff(staffList.slice(0, 5));
      setDepartments(deptList);
      setPendingLeaves(leaves.filter((l) => l.applicantType !== "student").slice(0, 5));
    } catch (err: any) {
      console.error("HrDashboard load error:", err);
      setError(err.message || "Failed to load HR dashboard analytics.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  const handleApproveLeave = async (leaveId: string) => {
    if (!organization || !firebaseUser) return;
    setProcessingLeaveId(leaveId);
    try {
      await approveLeaveRequest(organization.id, leaveId, firebaseUser.uid, userProfile?.name || "Admin");
      await loadDashboard();
    } catch (err: any) {
      alert("Failed to approve leave: " + err.message);
    } finally {
      setProcessingLeaveId(null);
    }
  };

  const handleRejectLeave = async (leaveId: string) => {
    if (!organization || !firebaseUser) return;
    const reason = prompt("Enter reason for rejection:");
    if (!reason) return;
    setProcessingLeaveId(leaveId);
    try {
      await rejectLeaveRequest(organization.id, leaveId, firebaseUser.uid, userProfile?.name || "Admin", reason);
      await loadDashboard();
    } catch (err: any) {
      alert("Failed to reject leave: " + err.message);
    } finally {
      setProcessingLeaveId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse p-4" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Error Loading Staff & HR Dashboard</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Staff & Human Resources Command Center
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time workforce directory, attendance roll-calls, leaves, compliance & payroll.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/hr/attendance/take">
              <CalendarCheck className="size-3.5 mr-1.5 text-primary" /> Take Attendance
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/hr/staff/new">
              <Plus className="size-3.5 mr-1.5" /> Add New Staff
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Staff */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Total Staff</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.totalStaff ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.activeStaff ?? 0} Active Employees
          </p>
        </div>

        {/* Teaching vs Non-Teaching */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Faculty Breakdown</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-2xl font-black text-foreground">{stats?.teachingStaff ?? 0}</p>
            <span className="text-xs font-semibold text-muted-foreground">Teaching</span>
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.nonTeachingStaff ?? 0} Non-Teaching Staff
          </p>
        </div>

        {/* Present Today */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Present Today</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-emerald-600">{stats?.presentToday ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.onLeaveToday ?? 0} On Authorized Leave
          </p>
        </div>

        {/* Pending Leaves & Compliance Warnings */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Action Required</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{stats?.pendingLeaves ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.documentsExpiringSoon ?? 0} Documents Expiring Soon
          </p>
        </div>
      </div>

      {/* Main Grid: Staff Directory Snapshot & Pending Leaves */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Staff Members */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Recent Staff Members</h2>
              <p className="text-xs text-muted-foreground">Newly registered faculty & administrators</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/hr/staff">Directory →</Link>
            </Button>
          </div>

          {recentStaff.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No staff records yet. Add your faculty and administrative members.
            </div>
          ) : (
            <div className="space-y-3">
              {recentStaff.map((st) => (
                <div
                  key={st.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="size-10 rounded-xl bg-secondary border border-border overflow-hidden flex items-center justify-center shrink-0">
                      {st.personal.photoUrl ? (
                        <img src={st.personal.photoUrl} alt="" className="size-full object-cover" />
                      ) : (
                        <span className="font-bold text-xs text-muted-foreground">
                          {st.personal.firstName[0]}
                          {st.personal.lastName[0]}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{st.fullName}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {st.professional.designationName} • {st.professional.departmentName}
                      </p>
                      <span className="font-mono text-[9px] text-primary font-bold">
                        {st.employeeId}
                      </span>
                    </div>
                  </div>

                  <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs shrink-0">
                    <Link to="/hr/staff/$staffId" params={{ staffId: st.id }}>
                      View →
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Leave Requests */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Pending Leave Applications</h2>
              <p className="text-xs text-muted-foreground">Faculty & employee time-off approval requests</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/hr/leave">Manage →</Link>
            </Button>
          </div>

          {pendingLeaves.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No pending leave requests. All applications have been reviewed.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingLeaves.map((l) => (
                <div
                  key={l.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 space-y-2 hover:bg-surface transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-foreground">{l.applicantName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {l.leaveType.toUpperCase()} • {l.days} day(s) ({l.startDate} to {l.endDate})
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleApproveLeave(l.id)}
                        disabled={processingLeaveId === l.id}
                        className="h-7 px-2 text-xs text-emerald-600 hover:bg-emerald-500/10 font-bold"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRejectLeave(l.id)}
                        disabled={processingLeaveId === l.id}
                        className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 font-bold"
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                  <p className="text-[11px] text-muted-foreground bg-card p-2 rounded-xl border border-border/60">
                    "{l.reason}"
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Department Distribution Snapshot */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Departmental Structure</h2>
            <p className="text-xs text-muted-foreground">Academic and operational divisions</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs">
            <Link to="/hr/departments">View All ({departments.length}) →</Link>
          </Button>
        </div>

        {departments.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground italic">
            No departments defined yet. Configure departments in Settings or Departments tab.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {departments.map((dept) => (
              <div
                key={dept.id}
                className="rounded-2xl border border-border bg-surface/50 p-4 space-y-1 hover:bg-surface transition-all"
              >
                <span className="font-mono text-[10px] font-bold text-primary">{dept.code}</span>
                <h3 className="text-xs font-bold text-foreground truncate">{dept.name}</h3>
                <p className="text-[11px] text-muted-foreground">
                  Head: {dept.headStaffName || "Not Appointed"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
