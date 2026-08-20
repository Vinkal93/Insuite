import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Sparkles,
  Users,
  CalendarCheck,
  CreditCard,
  BookOpen,
  Trophy,
  Bus,
  Megaphone,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import { getStudentAttendanceSummary } from "@/services/attendanceService";
import { getStudentFeeSummary } from "@/services/feeService";
import { getAssignments } from "@/services/academicWorkService";
import { listResults } from "@/services/examService";
import { listAnnouncements } from "@/services/communicationService";
import { listStudentAssignments } from "@/services/transportService";
import { Button } from "@/components/ui/button";

export const ParentDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const { parent, children: kids, selectedChild, isLoading: isParentLoading } = useParent();

  const [attendanceSummary, setAttendanceSummary] = useState<any | null>(null);
  const [feeSummary, setFeeSummary] = useState<any | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<any[]>([]);
  const [latestResult, setLatestResult] = useState<any | null>(null);
  const [notices, setNotices] = useState<any[]>([]);
  const [transport, setTransport] = useState<any | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadChildData = async () => {
    if (!organization || !selectedChild) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const sessionId = selectedChild.academic?.sessionId || "";

      const [att, fee, assignRes, resList, noticeList, transList] = await Promise.all([
        getStudentAttendanceSummary(organization.id, selectedChild.id, sessionId).catch(() => null),
        getStudentFeeSummary(organization.id, selectedChild.id).catch(() => null),
        getAssignments(organization.id, {
          sessionId,
          classId: selectedChild.academic?.classId,
          status: "PUBLISHED",
        }).catch(() => ({ assignments: [] })),
        listResults(organization.id, {
          studentId: selectedChild.id,
          status: "PUBLISHED",
        }).catch(() => []),
        listAnnouncements(organization.id, { targetAudience: "PARENTS" }).catch(() => []),
        listStudentAssignments(organization.id, {
          studentId: selectedChild.id,
          status: "Active",
        }).catch(() => []),
      ]);

      setAttendanceSummary(att);
      setFeeSummary(fee);
      const assignments = assignRes?.assignments || [];
      setPendingAssignments(assignments.slice(0, 3));
      setLatestResult(resList.length > 0 ? resList[0] : null);
      setNotices(noticeList.slice(0, 3));
      setTransport(transList.length > 0 ? transList[0] : null);
    } catch (err: any) {
      console.error("loadChildData error:", err);
      setError(err.message || "Failed to load child overview.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChildData();
  }, [organization, selectedChild]);

  if (isParentLoading) {
    return (
      <div className="space-y-4">
        <div className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (kids.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <Users className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">No Children Linked</h2>
        <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
          No student records are currently associated with your parent account. Please contact the school admissions office.
        </p>
      </div>
    );
  }

  // Attention Items calculation
  const attentionItems: { label: string; route: string; type: "fee" | "assignment" | "notice" }[] = [];
  if (feeSummary && feeSummary.totalPending > 0) {
    attentionItems.push({
      label: `Pending fee balance of ₹${feeSummary.totalPending.toLocaleString()} is due`,
      route: "/parent/fees",
      type: "fee",
    });
  }
  if (pendingAssignments.length > 0) {
    attentionItems.push({
      label: `${pendingAssignments.length} homework assignment(s) due soon`,
      route: "/parent/homework",
      type: "assignment",
    });
  }
  if (notices.length > 0) {
    attentionItems.push({
      label: `New school circular: "${notices[0].title}"`,
      route: "/parent/notices",
      type: "notice",
    });
  }

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-soft flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
            Welcome to InSuite
          </span>
          <h1 className="text-xl md:text-2xl font-black text-foreground mt-0.5">
            Good day, {parent?.firstName || "Parent"}!
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Viewing records for{" "}
            <span className="font-extrabold text-foreground">{selectedChild?.fullName}</span> (Class{" "}
            {selectedChild?.academic.className} - {selectedChild?.academic.sectionName})
          </p>
        </div>

        <Link
          to={`/parent/children/${selectedChild?.id}`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-card border border-border hover:border-primary text-xs font-bold text-foreground shadow-sm transition-colors self-start md:self-auto"
        >
          View Full Profile <ArrowRight className="size-3.5" />
        </Link>
      </div>

      {/* Attention Required Banner */}
      {attentionItems.length > 0 && (
        <div className="rounded-3xl border border-amber-500/20 bg-amber-500/5 p-5 shadow-soft space-y-3">
          <div className="flex items-center gap-2 text-amber-600 font-extrabold text-xs">
            <AlertTriangle className="size-4" />
            <span>Attention Required</span>
          </div>
          <div className="space-y-2">
            {attentionItems.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-card/80 p-3 rounded-2xl border border-border text-xs"
              >
                <span className="font-semibold text-foreground">{item.label}</span>
                <Link
                  to={item.route}
                  className="font-bold text-primary hover:underline text-[11px] shrink-0 ml-2"
                >
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Telemetry Widgets */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Attendance */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Attendance</span>
            <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <CalendarCheck className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {attendanceSummary ? `${attendanceSummary.percentage}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {attendanceSummary
                ? `${attendanceSummary.presentDays} of ${attendanceSummary.totalDays} days present`
                : "No attendance logged yet"}
            </p>
          </div>
          <Link
            to="/parent/attendance"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Attendance Calendar →
          </Link>
        </div>

        {/* Fees */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Fee Status</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <CreditCard className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {feeSummary ? `₹${feeSummary.totalPending.toLocaleString()}` : "₹0"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {feeSummary?.totalPending === 0
                ? "All dues cleared"
                : `Paid: ₹${feeSummary?.totalPaid?.toLocaleString() || 0}`}
            </p>
          </div>
          <Link
            to="/parent/fees"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Invoices & Receipts →
          </Link>
        </div>

        {/* Homework */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Homework</span>
            <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
              <BookOpen className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">{pendingAssignments.length}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Active assignments</p>
          </div>
          <Link
            to="/parent/homework"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            View Homework →
          </Link>
        </div>

        {/* Latest Result */}
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">Latest Result</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Trophy className="size-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-black text-foreground">
              {latestResult ? `${latestResult.percentage}%` : "—"}
            </p>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {latestResult ? `Grade: ${latestResult.grade}` : "No published results"}
            </p>
          </div>
          <Link
            to="/parent/exams"
            className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 pt-1"
          >
            Exam Report Cards →
          </Link>
        </div>
      </div>

      {/* Transport & Notices Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Transport Status */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Bus className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">Transport Allocation</h3>
                <p className="text-[11px] text-muted-foreground">Assigned school bus & route</p>
              </div>
            </div>
            <Link to="/parent/transport" className="text-xs font-bold text-primary hover:underline">
              Details →
            </Link>
          </div>

          {transport ? (
            <div className="bg-surface/50 p-4 rounded-2xl border border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Route Name:</span>
                <span className="font-bold text-foreground">{transport.routeName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Designated Stop:</span>
                <span className="font-semibold text-foreground">{transport.stopName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Vehicle Reg:</span>
                <span className="font-mono font-bold text-primary">{transport.vehicleRegNo}</span>
              </div>
            </div>
          ) : (
            <div className="bg-surface/30 p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No school bus or van allocated for this student.
            </div>
          )}
        </div>

        {/* School Circulars / Notices */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <Megaphone className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">School Circulars</h3>
                <p className="text-[11px] text-muted-foreground">Official parent announcements</p>
              </div>
            </div>
            <Link to="/parent/notices" className="text-xs font-bold text-primary hover:underline">
              All Notices →
            </Link>
          </div>

          {notices.length === 0 ? (
            <div className="bg-surface/30 p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
              No new school circulars posted.
            </div>
          ) : (
            <div className="space-y-2">
              {notices.map((n) => (
                <Link
                  key={n.id}
                  to="/parent/notices"
                  className="block p-3 rounded-2xl bg-surface/50 border border-border hover:border-primary/40 transition-colors"
                >
                  <h4 className="text-xs font-bold text-foreground line-clamp-1">{n.title}</h4>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{n.createdAt?.split("T")[0]}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
