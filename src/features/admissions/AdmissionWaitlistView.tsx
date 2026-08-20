import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Plus,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileCheck,
  Phone,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listWaitlist,
  updateWaitlistStatus,
  listApplications,
  addToWaitlist,
} from "@/services/admissionService";
import type { AdmissionWaitlistRecord, Application } from "@/types/admission";
import { Button } from "@/components/ui/button";

export const AdmissionWaitlistView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [waitlist, setWaitlist] = useState<AdmissionWaitlistRecord[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add to Waitlist Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedAppId, setSelectedAppId] = useState("");
  const [priority, setPriority] = useState<"Low" | "Normal" | "High" | "Urgent">("Normal");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [wList, appList] = await Promise.all([
        listWaitlist(organization.id),
        listApplications(organization.id, { status: "Submitted" }),
      ]);
      setWaitlist(wList);
      setApplications(appList);
      if (appList.length > 0) setSelectedAppId(appList[0].id);
    } catch (err: any) {
      console.error("loadWaitlist error:", err);
      setError(err.message || "Failed to load admission waitlist.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleStatusUpdate = async (
    waitlistId: string,
    newStatus: "Waiting" | "Offered" | "Accepted" | "Declined" | "Expired" | "Removed"
  ) => {
    if (!organization || !firebaseUser) return;
    try {
      await updateWaitlistStatus(organization.id, waitlistId, newStatus, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!selectedAppId) {
      alert("Please select an application.");
      return;
    }

    setIsSubmitting(true);
    try {
      await addToWaitlist(
        organization.id,
        { applicationId: selectedAppId, priority, notes: notes.trim() || null },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowAddModal(false);
      setNotes("");
      await loadData();
    } catch (err: any) {
      alert("Failed to add to waitlist: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Admission Waitlist
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Prioritized standby queue for oversubscribed classes and conditional applications.
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          onClick={() => setShowAddModal(true)}
          disabled={applications.length === 0}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1.5" /> Add to Waitlist
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : waitlist.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No students are currently waitlisted</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Applications awaiting seat availability can be placed on the priority waitlist.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Applicant Name</th>
                <th className="py-3 px-4">App #</th>
                <th className="py-3 px-4">Applying Class</th>
                <th className="py-3 px-4">Parent / Guardian</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {waitlist.map((w) => (
                <tr key={w.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-primary">#{w.waitlistPosition}</td>
                  <td className="py-3 px-4 font-bold text-foreground">{w.studentName}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{w.applicationNumber}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{w.applyingClass}</td>
                  <td className="py-3 px-4 text-muted-foreground">{w.guardianName}</td>
                  <td className="py-3 px-4 font-mono text-muted-foreground">{w.mobile}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        w.priority === "Urgent" || w.priority === "High"
                          ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                          : "bg-secondary text-muted-foreground border-border"
                      }`}
                    >
                      {w.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        w.status === "Offered"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : w.status === "Waiting"
                          ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {w.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {w.status === "Waiting" && (
                        <Button
                          variant="hero"
                          size="sm"
                          onClick={() => handleStatusUpdate(w.id, "Offered")}
                          className="h-6 px-2 text-xs font-bold"
                        >
                          Offer Seat
                        </Button>
                      )}
                      {w.status === "Offered" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleStatusUpdate(w.id, "Accepted")}
                          className="h-6 px-2 text-xs text-emerald-600 border-emerald-500/20"
                        >
                          Accepted
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Place Applicant on Waitlist</h3>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Select Application *
                </label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {applications.map((app) => (
                    <option key={app.id} value={app.id}>
                      {app.student.fullName} ({app.applicationNumber}) — Class: {app.applyingClass}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Normal">Normal</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Waitlist Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Sibling already studying in Grade 8, awaiting section vacancy"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isSubmitting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmitting ? "Adding..." : "Add to Waitlist"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
