import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Plus,
  ArrowLeft,
  AlertCircle,
  RefreshCw,
  Video,
  MapPin,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getPtmEvent,
  listPtmSlots,
  listPtmAppointments,
  generatePtmSlots,
  updatePtmEvent,
} from "@/services/ptmService";
import { getTeachers } from "@/services/academicService";
import type { PtmEvent, PtmSlot, PtmAppointment } from "@/types/ptm";
import type { Teacher } from "@/types/academic";
import { Button } from "@/components/ui/button";

export const PtmEventDetailView: React.FC = () => {
  const { eventId } = useParams({ strict: false }) as { eventId: string };
  const { organization, firebaseUser, userProfile } = useAuth();

  const [event, setEvent] = useState<PtmEvent | null>(null);
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [appointments, setAppointments] = useState<PtmAppointment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [activeTab, setActiveTab] = useState<"slots" | "appointments">("slots");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventData = async () => {
    if (!organization || !eventId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ev, slList, apptList, tList] = await Promise.all([
        getPtmEvent(organization.id, eventId),
        listPtmSlots(organization.id, eventId),
        listPtmAppointments(organization.id, { eventId }),
        getTeachers(organization.id),
      ]);

      setEvent(ev);
      setSlots(slList);
      setAppointments(apptList);
      setTeachers(tList);
    } catch (err: any) {
      console.error("loadPtmEventDetail error:", err);
      setError(err.message || "Failed to load event details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventData();
  }, [organization, eventId]);

  const handleGenerateSlots = async () => {
    if (!organization || !event || !firebaseUser) return;
    if (teachers.length === 0) {
      alert("No faculty members found in school records. Please add teachers first.");
      return;
    }

    if (!confirm(`Generate ${event.slotDuration}-minute time slots for all ${teachers.length} teachers?`)) {
      return;
    }

    setIsGenerating(true);
    try {
      const teacherPayload = teachers.map((t) => ({
        id: t.id,
        name: `${t.firstName} ${t.lastName}`,
      }));

      await generatePtmSlots(
        organization.id,
        event.id,
        teacherPayload,
        event.startTime,
        event.endTime,
        event.slotDuration,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      alert("Time slots generated successfully!");
      await loadEventData();
    } catch (err: any) {
      alert("Failed to generate slots: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusToggle = async (newStatus: "OPEN" | "CLOSED" | "COMPLETED") => {
    if (!organization || !event || !firebaseUser) return;
    try {
      await updatePtmEvent(
        organization.id,
        event.id,
        { status: newStatus },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      await loadEventData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !event) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error || "Event not found."}</p>
        <Link
          to="/ptm/events"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Return to Events
        </Link>
      </div>
    );
  }

  const availableSlots = slots.filter((s) => s.status === "AVAILABLE");
  const bookedSlots = slots.filter((s) => s.status === "BOOKED");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/ptm/events"
            className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">{event.name}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  event.status === "OPEN"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : event.status === "DRAFT"
                    ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
              >
                {event.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono">
              Date: {event.date} • {event.startTime} - {event.endTime} ({event.mode})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {slots.length === 0 && (
            <Button
              variant="hero"
              size="sm"
              onClick={handleGenerateSlots}
              disabled={isGenerating}
              className="rounded-xl text-xs font-bold"
            >
              <Sparkles className="size-3.5 mr-1.5" />
              {isGenerating ? "Generating..." : "Generate Slots"}
            </Button>
          )}

          {event.status === "DRAFT" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusToggle("OPEN")}
              className="rounded-xl text-xs font-bold"
            >
              Open for Bookings
            </Button>
          )}

          {event.status === "OPEN" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusToggle("CLOSED")}
              className="rounded-xl text-xs font-bold text-rose-600"
            >
              Close Bookings
            </Button>
          )}
        </div>
      </div>

      {/* Telemetry Overview */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Total Slots</span>
          <p className="text-2xl font-black text-foreground mt-1">{slots.length}</p>
          <span className="text-[10px] text-muted-foreground">{event.slotDuration} mins duration</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Available Slots</span>
          <p className="text-2xl font-black text-emerald-600 mt-1">{availableSlots.length}</p>
          <span className="text-[10px] text-muted-foreground">Ready for booking</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Booked Slots</span>
          <p className="text-2xl font-black text-primary mt-1">{bookedSlots.length}</p>
          <span className="text-[10px] text-muted-foreground">Confirmed appts</span>
        </div>

        <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
          <span className="text-[10px] font-bold text-muted-foreground uppercase">Faculty Count</span>
          <p className="text-2xl font-black text-foreground mt-1">{teachers.length}</p>
          <span className="text-[10px] text-muted-foreground">Assigned teachers</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("slots")}
          className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-colors ${
            activeTab === "slots"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Time Slots Grid ({slots.length})
        </button>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`pb-2 px-3 text-xs font-extrabold border-b-2 transition-colors ${
            activeTab === "appointments"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Booked Appointments ({appointments.length})
        </button>
      </div>

      {/* Slots Grid */}
      {activeTab === "slots" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          {slots.length === 0 ? (
            <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground space-y-2">
              <p>No time slots generated yet for this event.</p>
              <Button
                variant="hero"
                size="sm"
                onClick={handleGenerateSlots}
                disabled={isGenerating}
                className="rounded-xl text-xs font-bold"
              >
                Generate Faculty Slots Now
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {slots.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl border border-border bg-surface/50 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-foreground">
                      {s.startTime} - {s.endTime}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        s.status === "AVAILABLE"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-primary/10 text-primary border-primary/20"
                      }`}
                    >
                      {s.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground truncate">{s.teacherName}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments List */}
      {activeTab === "appointments" && (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          {appointments.length === 0 ? (
            <div className="bg-surface/30 p-8 text-center text-xs text-muted-foreground">
              No parent appointments booked for this event yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Parent</th>
                    <th className="py-3 px-4">Teacher</th>
                    <th className="py-3 px-4">Class</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {appointments.map((a) => (
                    <tr key={a.id} className="hover:bg-surface/30 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-primary">
                        {a.startTime} - {a.endTime}
                      </td>
                      <td className="py-3 px-4 font-bold text-foreground">{a.studentName}</td>
                      <td className="py-3 px-4 text-muted-foreground">{a.parentName}</td>
                      <td className="py-3 px-4 text-foreground">{a.teacherName}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        Class {a.className} - {a.sectionName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {a.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
