import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  AlertCircle,
  RefreshCw,
  Video,
  MapPin,
  FileText,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listPtmAppointments,
  cancelPtmAppointment,
  completePtmAppointment,
} from "@/services/ptmService";
import type { PtmAppointment } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmAppointmentsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [appointments, setAppointments] = useState<PtmAppointment[]>([]);
  const [selectedApptForCompletion, setSelectedApptForCompletion] = useState<PtmAppointment | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [parentSummary, setParentSummary] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(false);
  const [followUpDate, setFollowUpDate] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listPtmAppointments(organization.id);
      setAppointments(list);
    } catch (err: any) {
      console.error("loadPtmAppointments error:", err);
      setError(err.message || "Failed to load appointments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [organization]);

  const handleCancel = async (appt: PtmAppointment) => {
    const reason = prompt("Please enter the reason for cancellation:");
    if (!reason || !organization || !firebaseUser) return;

    try {
      await cancelPtmAppointment(organization.id, appt.id, reason, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      alert("Appointment cancelled and slot released successfully.");
      await loadAppointments();
    } catch (err: any) {
      alert("Failed to cancel: " + err.message);
    }
  };

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
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      alert("Meeting marked as completed with meeting notes saved.");
      setSelectedApptForCompletion(null);
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
          PTM Appointments Roster
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          All parent-teacher conference bookings, confirmation statuses, and meeting notes.
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
          <h3 className="mt-3 text-sm font-bold text-foreground">No appointments booked</h3>
          <p className="mt-1 text-xs text-muted-foreground">Bookings will appear as parents reserve time slots.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Parent</th>
                  <th className="py-3 px-4">Teacher</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {appointments.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-mono font-bold text-foreground block">{a.date}</span>
                      <span className="font-mono text-primary font-bold">
                        {a.startTime} - {a.endTime}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{a.studentName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        Class {a.className} - {a.sectionName}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="font-semibold text-foreground block">{a.parentName}</span>
                      <span className="text-[10px] font-mono">{a.parentPhone || "—"}</span>
                    </td>

                    <td className="py-3 px-4 text-foreground font-semibold">
                      {a.teacherName} {a.subjectName ? `(${a.subjectName})` : ""}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground">
                        {a.mode}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          a.status === "CONFIRMED" || a.status === "COMPLETED"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : a.status === "CANCELLED"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {a.status === "CONFIRMED" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApptForCompletion(a)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5"
                          >
                            <CheckCircle2 className="size-3 mr-1" /> Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(a)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2 text-rose-600 hover:bg-rose-50"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Meeting Modal */}
      {selectedApptForCompletion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-3xl p-6 shadow-soft w-full max-w-lg space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-foreground">
                Complete Meeting: {selectedApptForCompletion.studentName}
              </h3>
              <button
                onClick={() => setSelectedApptForCompletion(null)}
                className="text-xs text-muted-foreground hover:text-foreground font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Parent-Facing Summary Notes *
                </label>
                <textarea
                  rows={2}
                  required
                  value={parentSummary}
                  onChange={(e) => setParentSummary(e.target.value)}
                  placeholder="Summary visible to the parent (behavior, study tips, improvement points)..."
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-foreground mb-1">
                  Internal Faculty Notes (Confidential)
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Private internal notes (NOT shared with parent)..."
                  className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="followUp"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  className="rounded border-border text-primary focus:ring-primary size-4"
                />
                <label htmlFor="followUp" className="font-semibold text-foreground cursor-pointer">
                  Follow-up meeting or check-in required
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
                  {isProcessing ? "Saving..." : "Finalize Meeting Notes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
