import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Plus,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import {
  listPtmEvents,
  listPtmSlots,
  listPtmAppointments,
  bookPtmSlotAtomic,
  cancelPtmAppointment,
  getPtmMeetingNote,
} from "@/services/ptmService";
import { getTeachers } from "@/services/academicService";
import type { PtmEvent, PtmSlot, PtmAppointment, PtmMeetingNote } from "@/types/ptm";
import type { Teacher } from "@/types/academic";
import { Button } from "@/components/ui/button";

export const ParentPtmView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { selectedChild, parent, children: kids } = useParent();

  const [events, setEvents] = useState<PtmEvent[]>([]);
  const [appointments, setAppointments] = useState<PtmAppointment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<PtmEvent | null>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<PtmSlot | null>(null);
  const [viewingNote, setViewingNote] = useState<PtmMeetingNote | null>(null);
  const [isBooking, setIsBooking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization || !selectedChild) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [evList, apptList, tList] = await Promise.all([
        listPtmEvents(organization.id, { status: "OPEN" }),
        listPtmAppointments(organization.id, {
          studentId: selectedChild.id,
        }),
        getTeachers(organization.id),
      ]);

      setEvents(evList);
      setAppointments(apptList);
      setTeachers(tList);
      if (evList.length > 0 && !selectedEvent) {
        setSelectedEvent(evList[0]);
      }
    } catch (err: any) {
      console.error("loadParentPtm error:", err);
      setError(err.message || "Failed to load PTM information.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedChild]);

  // Load available slots when selectedEvent & selectedTeacherId change
  useEffect(() => {
    const fetchSlots = async () => {
      if (!organization || !selectedEvent) return;
      try {
        const slList = await listPtmSlots(
          organization.id,
          selectedEvent.id,
          selectedTeacherId || undefined
        );
        setSlots(slList.filter((s) => s.status === "AVAILABLE"));
      } catch (err) {
        console.error("fetchSlots error:", err);
      }
    };
    fetchSlots();
  }, [organization, selectedEvent, selectedTeacherId]);

  const handleBookSlot = async (slot: PtmSlot) => {
    if (!organization || !selectedChild || !selectedEvent || !firebaseUser) return;

    const teacherObj = teachers.find((t) => t.id === slot.teacherId);

    setIsBooking(true);
    try {
      await bookPtmSlotAtomic(
        organization.id,
        slot.id,
        {
          eventId: selectedEvent.id,
          eventName: selectedEvent.name,
          startTime: slot.startTime,
          endTime: slot.endTime,
          date: selectedEvent.date,
          parentId: parent?.id || firebaseUser.uid,
          parentName: parent?.fullName || userProfile?.name || "Parent",
          parentPhone: parent?.phone || userProfile?.phone || "",
          studentId: selectedChild.id,
          studentName: selectedChild.fullName,
          teacherId: slot.teacherId,
          teacherName: slot.teacherName,
          classId: selectedChild.academic.classId,
          className: selectedChild.academic.className,
          sectionId: selectedChild.academic.sectionId,
          sectionName: selectedChild.academic.sectionName,
          mode: selectedEvent.mode,
          location: selectedEvent.location,
          meetingLink: selectedEvent.meetingLink,
        },
        { uid: firebaseUser.uid, name: parent?.fullName || userProfile?.name || "Parent" }
      );

      alert("Parent-Teacher appointment confirmed successfully!");
      setSelectedSlot(null);
      await loadData();
    } catch (err: any) {
      alert("Booking failed: " + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handleCancelAppt = async (appt: PtmAppointment) => {
    const reason = prompt("Reason for cancellation:");
    if (!reason || !organization || !firebaseUser) return;

    try {
      await cancelPtmAppointment(organization.id, appt.id, reason, {
        uid: firebaseUser.uid,
        name: parent?.fullName || userProfile?.name || "Parent",
      });
      alert("Appointment cancelled successfully.");
      await loadData();
    } catch (err: any) {
      alert("Failed to cancel: " + err.message);
    }
  };

  const handleViewNote = async (apptId: string) => {
    if (!organization) return;
    try {
      const note = await getPtmMeetingNote(organization.id, apptId);
      setViewingNote(note);
    } catch (err) {
      console.error("handleViewNote error:", err);
    }
  };

  if (kids.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <CalendarCheck className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">No Children Linked</h2>
        <p className="mt-1 text-xs text-muted-foreground">Please contact school administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Parent-Teacher Meetings (PTM)
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Schedule one-on-one conference slots with teachers for{" "}
          <span className="font-bold text-foreground">{selectedChild?.fullName}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* My Booked Appointments Section */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-sm font-extrabold text-foreground">My Booked Appointments</h3>

            {appointments.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No conference appointments booked for {selectedChild?.fullName} yet.
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl border border-border bg-surface/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-foreground">{a.teacherName}</span>
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                            a.status === "CONFIRMED" || a.status === "COMPLETED"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                          }`}
                        >
                          {a.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                        Date: {a.date} • Time: {a.startTime} - {a.endTime} ({a.mode})
                      </p>
                      {a.location && (
                        <p className="text-[10px] text-primary flex items-center gap-1 mt-0.5">
                          <MapPin className="size-3" /> Location: {a.location}
                        </p>
                      )}
                      {a.meetingLink && (
                        <a
                          href={a.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1 mt-0.5"
                        >
                          <Video className="size-3" /> Join Virtual Meeting ↗
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center">
                      {a.status === "COMPLETED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewNote(a.id)}
                          className="rounded-xl text-[11px] font-bold"
                        >
                          <FileText className="size-3 mr-1" /> View Summary
                        </Button>
                      )}

                      {a.status === "CONFIRMED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelAppt(a)}
                          className="rounded-xl text-[11px] font-bold text-rose-600 hover:bg-rose-50"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Book New Appointment Section */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
            <div>
              <h3 className="text-sm font-extrabold text-foreground">Book PTM Conference Slot</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Select an open conference event and pick an available faculty time slot.
              </p>
            </div>

            {events.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No active PTM events are currently open for booking.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Event Selector Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {events.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => {
                        setSelectedEvent(e);
                        setSelectedSlot(null);
                      }}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                        selectedEvent?.id === e.id
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "bg-surface border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {e.name} ({e.date})
                    </button>
                  ))}
                </div>

                {/* Faculty Filter */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Select Subject Teacher
                  </label>
                  <select
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full sm:w-72 rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">All Available Teachers</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.firstName} {t.lastName} ({t.department || "Faculty"})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Available Slots */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-2">
                    Available Time Slots ({slots.length})
                  </label>

                  {slots.length === 0 ? (
                    <div className="bg-surface/30 p-6 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                      No available time slots for the selected teacher.
                    </div>
                  ) : (
                    <div className="grid gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                      {slots.map((s) => (
                        <div
                          key={s.id}
                          className="p-3 rounded-2xl border border-border bg-surface/50 space-y-2 text-xs flex flex-col justify-between"
                        >
                          <div>
                            <span className="font-mono font-bold text-foreground block">
                              {s.startTime} - {s.endTime}
                            </span>
                            <span className="text-[11px] text-muted-foreground truncate block">
                              {s.teacherName}
                            </span>
                          </div>

                          <Button
                            variant="hero"
                            size="sm"
                            disabled={isBooking}
                            onClick={() => handleBookSlot(s)}
                            className="rounded-xl text-[10px] font-bold h-7 w-full"
                          >
                            Book Slot
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Summary Modal */}
          {viewingNote && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
              <div className="bg-card border border-border rounded-3xl p-6 shadow-soft w-full max-w-md space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-sm text-foreground">
                    Teacher Conference Summary
                  </h3>
                  <button
                    onClick={() => setViewingNote(null)}
                    className="text-xs text-muted-foreground hover:text-foreground font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="bg-surface/50 p-4 rounded-2xl border border-border text-muted-foreground leading-relaxed whitespace-pre-line">
                  {viewingNote.parentSummary || "No summary notes provided for this meeting."}
                </div>

                {viewingNote.followUpRequired && viewingNote.followUpDate && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 font-semibold">
                    Follow-up scheduled: {viewingNote.followUpDate}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
