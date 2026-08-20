import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowRight,
  AlertCircle,
  RefreshCw,
  Video,
  MapPin,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getPtmDashboardStats,
  listPtmEvents,
  listPtmAppointments,
} from "@/services/ptmService";
import type { PtmEvent, PtmAppointment, PtmDashboardStats } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<PtmDashboardStats | null>(null);
  const [events, setEvents] = useState<PtmEvent[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<PtmAppointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const todayStr = new Date().toISOString().split("T")[0];
      const [s, evList, apptList] = await Promise.all([
        getPtmDashboardStats(organization.id),
        listPtmEvents(organization.id),
        listPtmAppointments(organization.id),
      ]);

      setStats(s);
      setEvents(evList.slice(0, 4));
      setTodayAppointments(apptList.filter((a) => a.date === todayStr).slice(0, 5));
    } catch (err: any) {
      console.error("loadPtmDashboard error:", err);
      setError(err.message || "Failed to load PTM dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Parent-Teacher Meetings (PTM)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Meeting events, atomic slot generation, parent bookings, and faculty schedules.
          </p>
        </div>

        <div className="flex gap-2 self-start sm:self-auto">
          <Link
            to="/ptm/events/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="size-4" /> Create PTM Event
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
                <span className="text-xs font-bold text-muted-foreground">Active Events</span>
                <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Calendar className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">{stats?.activeEventsCount || 0}</p>
              <Link to="/ptm/events" className="text-[11px] font-bold text-primary hover:underline">
                View All Events →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Booked Slots</span>
                <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <CalendarCheck className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">{stats?.bookedSlotsCount || 0}</p>
              <span className="text-[11px] text-muted-foreground font-semibold">
                Available: {stats?.availableSlotsCount || 0}
              </span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Upcoming Appts</span>
                <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Clock className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {stats?.upcomingMeetingsCount || 0}
              </p>
              <Link to="/ptm/appointments" className="text-[11px] font-bold text-primary hover:underline">
                All Appointments →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Completed</span>
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.completedMeetingsCount || 0}
              </p>
              <span className="text-[11px] text-rose-600 font-semibold">
                Cancelled: {stats?.cancelledMeetingsCount || 0}
              </span>
            </div>
          </div>

          {/* Two-Column Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Active PTM Events */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-foreground">PTM Event Schedule</h3>
                <Link to="/ptm/events" className="text-xs font-bold text-primary hover:underline">
                  All Events →
                </Link>
              </div>

              {events.length === 0 ? (
                <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No PTM events created yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((e) => (
                    <div
                      key={e.id}
                      className="p-4 rounded-2xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-foreground">{e.name}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                              e.status === "OPEN"
                                ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                : e.status === "DRAFT"
                                ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                : "bg-secondary text-muted-foreground border-border"
                            }`}
                          >
                            {e.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          Date: {e.date} • {e.startTime} - {e.endTime} ({e.mode})
                        </p>
                      </div>

                      <Link
                        to={`/ptm/events/${e.id}`}
                        className="inline-flex items-center gap-1 font-bold text-primary hover:underline text-[11px] self-start sm:self-center"
                      >
                        Manage Event <ArrowRight className="size-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Today's Appointments */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold text-foreground">Today's Appointments</h3>
                <Link to="/ptm/appointments" className="text-xs font-bold text-primary hover:underline">
                  Full Roster →
                </Link>
              </div>

              {todayAppointments.length === 0 ? (
                <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                  No appointments scheduled for today.
                </div>
              ) : (
                <div className="space-y-2">
                  {todayAppointments.map((a) => (
                    <div
                      key={a.id}
                      className="p-3 rounded-2xl bg-surface/50 border border-border flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{a.studentName}</span>
                          <span className="text-[10px] text-muted-foreground">({a.parentName})</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          Teacher: {a.teacherName} {a.subjectName ? `(${a.subjectName})` : ""}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="font-mono font-bold text-primary">
                          {a.startTime} - {a.endTime}
                        </span>
                        <span className="block text-[9px] font-bold text-emerald-600">
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
