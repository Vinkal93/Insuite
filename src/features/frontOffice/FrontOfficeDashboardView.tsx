import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  UserCheck,
  CalendarCheck,
  PhoneCall,
  Mail,
  Ticket,
  Clock,
  Plus,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  LogOut,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getFrontOfficeDashboardStats,
  listActiveVisitorsInside,
  listFrontOfficeAppointments,
  checkOutVisitor,
} from "@/services/frontOfficeService";
import type {
  FrontOfficeVisit,
  FrontOfficeAppointment,
  FrontOfficeDashboardStats,
} from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const FrontOfficeDashboardView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [stats, setStats] = useState<FrontOfficeDashboardStats | null>(null);
  const [activeVisits, setActiveVisits] = useState<FrontOfficeVisit[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<FrontOfficeAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [s, inside, appts] = await Promise.all([
        getFrontOfficeDashboardStats(organization.id),
        listActiveVisitorsInside(organization.id),
        listFrontOfficeAppointments(organization.id, { date: todayStr }),
      ]);
      setStats(s);
      setActiveVisits(inside);
      setTodayAppointments(appts.slice(0, 5));
    } catch (err: any) {
      console.error("loadFrontOfficeDashboard error:", err);
      setError(err.message || "Failed to load front office dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  const handleQuickCheckOut = async (visitId: string, visitorName: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Check out ${visitorName} now?`)) return;

    try {
      await checkOutVisitor(organization.id, visitId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Receptionist",
      });
      alert(`${visitorName} checked out successfully.`);
      await loadDashboard();
    } catch (err: any) {
      alert("Check-out failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Front Desk & Reception
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Visitor management, instant gate passes, appointment logs, calls, and correspondence.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link
            to="/front-office/visitors/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="size-4" /> Check In Visitor
          </Link>
          <Link
            to="/front-office/appointments/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-card border border-border text-foreground text-xs font-bold hover:border-primary transition-colors"
          >
            <CalendarCheck className="size-4" /> Book Appointment
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* 4 Telemetry Widgets */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Today's Visitors</span>
                <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Users className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.todaysVisitorsCount || 0}
              </p>
              <Link to="/front-office/visitors" className="text-[11px] font-bold text-primary hover:underline">
                Visitor Logs →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Currently Inside</span>
                <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <UserCheck className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {stats?.currentlyInsideCount || 0}
              </p>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Active on campus
              </span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Today's Appts</span>
                <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <CalendarCheck className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600">
                {stats?.todaysAppointmentsCount || 0}
              </p>
              <Link to="/front-office/appointments" className="text-[11px] font-bold text-primary hover:underline">
                View Appointments →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Active Gate Passes</span>
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Ticket className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.activeGatePassesCount || 0}
              </p>
              <Link to="/front-office/gate-passes" className="text-[11px] font-bold text-primary hover:underline">
                Manage Passes →
              </Link>
            </div>
          </div>

          {/* Two-Column Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Currently Inside Visitors */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h3 className="text-sm font-extrabold text-foreground">
                    Visitors Currently Inside ({activeVisits.length})
                  </h3>
                </div>
                <Link to="/front-office/visitors" className="text-xs font-bold text-primary hover:underline">
                  All Visitors →
                </Link>
              </div>

              {activeVisits.length === 0 ? (
                <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No visitors are currently inside the premises.
                </div>
              ) : (
                <div className="space-y-3">
                  {activeVisits.map((v) => (
                    <div
                      key={v.id}
                      className="p-4 rounded-2xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground">{v.visitorName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary">
                            {v.visitorType}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono">
                          Meeting: {v.personToMeetName} • Purpose: {v.purpose}
                        </p>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          Entry: {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Pass: {v.gatePassNumber}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuickCheckOut(v.id, v.visitorName)}
                        className="rounded-xl text-[11px] font-bold h-7 px-3 text-rose-600 hover:bg-rose-50 self-start sm:self-center"
                      >
                        <LogOut className="size-3 mr-1" /> Check Out
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Appointments */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-foreground">Today's Appointments</h3>
                <Link to="/front-office/appointments" className="text-xs font-bold text-primary hover:underline">
                  All Appointments →
                </Link>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No appointments scheduled for today.
                </div>
              ) : (
                <div className="space-y-3">
                  {todayAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3.5 rounded-2xl bg-surface/50 border border-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{a.visitorName}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            ({a.visitorMobile})
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Meeting: {a.personToMeetName} ({a.departmentName || "Staff"})
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-primary block">
                          {a.startTime} - {a.endTime}
                        </span>
                        <span className="text-[9px] font-bold text-emerald-600">
                          {a.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
