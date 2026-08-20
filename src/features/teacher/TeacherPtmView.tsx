import React, { useState, useEffect } from "react";
import {
  CalendarCheck,
  Calendar,
  Clock,
  Users,
  Video,
  MapPin,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Save,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import {
  listPtmAppointments,
  completePtmAppointment,
  listPtmEvents,
} from "@/services/ptmService";
import type { PtmAppointment, PtmEvent } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const TeacherPtmView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const { teacher } = useTeacher();

  const [appointments, setAppointments] = useState<PtmAppointment[]>([]);
  const [selectedApptForCompletion, setSelectedApptForCompletion] = useState<PtmAppointment | null>(null);
  const [parentSummary, setParentSummary] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!organization || !teacher) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listPtmAppointments(organization.id, {
        teacherId: teacher.id,
      });
      setAppointments(list);
    } catch (err: any) {
      console.error("loadTeacherPtm error:", err);
      setError(err.message || "Failed to load PTM appointments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [organization, teacher]);

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !selectedApptForCompletion) return;

    setIsProcessing(true);
    try {
      await completePtmAppointment(
        organization.id,
        selectedApptForCompletion.id,
        {
          internalNotes: internalNotes.trim(),
          parentSummary: parentSummary.trim(),
          followUpRequired,
          followUpDate,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || teacher?.fullName || "Teacher" }
      );

      alert("Meeting finalized and notes recorded successfully.");
      setSelectedApptForCompletion(null);
      setParentSummary("");
      setInternalNotes("");
      await loadAppointments();
    } catch (err: any) {
      alert("Failed to complete meeting: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          My PTM Appointments
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          One-on-one conference bookings with parents, meeting summaries, and follow-ups.
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadAppointments} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : appointments.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <CalendarCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No PTM meetings scheduled</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Appointments booked by parents for your time slots will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => (
            <div
              key={a.id}
              className="p-5 rounded-3xl border border-border bg-card shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs hover:border-primary/40 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm text-foreground">{a.studentName}</span>
                  <span className="text-[10px] text-muted-foreground">
                    (Parent: {a.parentName})
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      a.status === "COMPLETED"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-primary/10 text-primary border-primary/20"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">
                  Date: {a.date} • Time: {a.startTime} - {a.endTime} • Class: {a.className} (
                  {a.sectionName})
                </p>
                {a.meetingLink && (
                  <a
                    href={a.meetingLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-blue-600 font-bold hover:underline flex items-center gap-1"
                  >
                    <Video className="size-3" /> Join Virtual Meeting ↗
                  </a>
                )}
              </div>

              {a.status === "CONFIRMED" && (
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => setSelectedApptForCompletion(a)}
                  className="rounded-xl text-[11px] font-bold self-start sm:self-center"
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Finalize Meeting Notes
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Meeting Finalization Modal */}
      {selectedApptForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft w-full max-w-lg space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground">
                Finalize Meeting: {selectedApptForCompletion.studentName}
              </h3>
              <button
                onClick={() => setSelectedApptForCompletion(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Parent Summary Notes * (Visible to Parent)
                </label>
                <textarea
                  rows={3}
                  required
                  value={parentSummary}
                  onChange={(e) => setParentSummary(e.target.value)}
                  placeholder="Behavior, academic strengths, areas needing improvement, home study tips..."
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Internal Faculty Notes (Confidential — Admin/Faculty Only)
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private internal observations (will not be displayed to parent)..."
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="teacherFollowUp"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                <label htmlFor="teacherFollowUp" className="font-semibold text-foreground cursor-pointer">
                  Follow-up check-in required
                </label>
              </div>

              {followUpRequired && (
                <div>
                  <label className="block font-semibold text-foreground mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedApptForCompletion(null)}
                  className="rounded-xl text-xs font-bold"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isProcessing || !parentSummary.trim()}
                  className="rounded-xl text-xs font-bold"
                >
                  <Save className="size-3.5 mr-1" />
                  {isProcessing ? "Saving..." : "Save Meeting Notes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
