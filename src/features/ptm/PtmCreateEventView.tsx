import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Save, Send } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createPtmEvent } from "@/services/ptmService";
import type { PtmMode, PtmEventStatus } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmCreateEventView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [mode, setMode] = useState<PtmMode>("IN_PERSON");
  const [slotDuration, setSlotDuration] = useState("15");
  const [location, setLocation] = useState("School Main Auditorium / Classrooms");
  const [meetingLink, setMeetingLink] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent, status: PtmEventStatus) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;

    if (endTime <= startTime) {
      alert("End time must be later than start time.");
      return;
    }

    setIsSubmitting(true);
    try {
      const ev = await createPtmEvent(
        organization.id,
        {
          name: name.trim(),
          description: description.trim(),
          academicSessionId: "",
          date,
          startTime,
          endTime,
          mode,
          slotDuration: Number(slotDuration) || 15,
          location: mode === "ONLINE" ? "" : location.trim(),
          meetingLink: mode === "IN_PERSON" ? "" : meetingLink.trim(),
          status,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      alert(`PTM event ${status === "OPEN" ? "published" : "created"} successfully!`);
      navigate({ to: `/ptm/events/${ev.id}` });
    } catch (err: any) {
      alert("Failed to create PTM event: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/ptm/events"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Create PTM Event</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Schedule parent-teacher conference date, duration, and participation modes.
          </p>
        </div>
      </div>

      <form className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Event Name *</label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Term 1 Parent-Teacher Conference 2026"
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Instructions for parents regarding slot booking, reports, and attendance..."
            className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        {/* Date & Timings */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Meeting Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Start Time *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono font-bold"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">End Time *</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono font-bold"
            />
          </div>
        </div>

        {/* Mode & Duration */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Meeting Mode *</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as PtmMode)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="IN_PERSON">In Person (On Campus)</option>
              <option value="ONLINE">Online (Virtual Meeting)</option>
              <option value="HYBRID">Hybrid (In Person & Online)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Slot Duration (Minutes) *
            </label>
            <select
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none font-mono font-bold"
            >
              <option value="10">10 Minutes per parent</option>
              <option value="15">15 Minutes per parent</option>
              <option value="20">20 Minutes per parent</option>
              <option value="30">30 Minutes per parent</option>
            </select>
          </div>
        </div>

        {/* Location or Meeting Link */}
        {mode !== "ONLINE" && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Physical Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. High School Wing Rooms 101 - 108"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        )}

        {mode !== "IN_PERSON" && (
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Online Meeting Link</label>
            <input
              type="url"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              placeholder="https://meet.google.com/xyz-abcd-efg"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none font-mono"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isSubmitting}
            onClick={(e) => handleSubmit(e, "DRAFT")}
            className="rounded-xl text-xs font-bold"
          >
            <Save className="size-3.5 mr-1.5" /> Save Draft
          </Button>

          <Button
            type="button"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !name.trim()}
            onClick={(e) => handleSubmit(e, "OPEN")}
            className="rounded-xl text-xs font-bold"
          >
            <Send className="size-3.5 mr-1.5" /> Open for Bookings
          </Button>
        </div>
      </form>
    </div>
  );
};
