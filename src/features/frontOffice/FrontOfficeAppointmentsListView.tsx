import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listFrontOfficeAppointments,
  completeFrontOfficeAppointment,
  cancelFrontOfficeAppointment,
} from "@/services/frontOfficeService";
import type { FrontOfficeAppointment } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const FrontOfficeAppointmentsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [appointments, setAppointments] = useState<FrontOfficeAppointment[]>([]);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listFrontOfficeAppointments(organization.id, {
        status: selectedStatus || undefined,
      });
      setAppointments(list);
    } catch (err: any) {
      console.error("loadAppointments error:", err);
      setError(err.message || "Failed to load appointments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [organization, selectedStatus]);

  const handleComplete = async (apptId: string) => {
    const notes = prompt("Enter meeting completion notes:");
    if (notes === null || !organization || !firebaseUser) return;

    try {
      await completeFrontOfficeAppointment(organization.id, apptId, notes, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Staff",
      });
      alert("Appointment marked as completed.");
      await loadAppointments();
    } catch (err: any) {
      alert("Failed to complete appointment: " + err.message);
    }
  };

  const handleCancel = async (apptId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Cancel this appointment?")) return;

    try {
      await cancelFrontOfficeAppointment(organization.id, apptId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Staff",
      });
      alert("Appointment cancelled.");
      await loadAppointments();
    } catch (err: any) {
      alert("Failed to cancel: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Front Desk Appointments
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scheduled meetings with Principal, administration, counsellors, and faculty.
          </p>
        </div>

        <Link
          to="/front-office/appointments/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Book New Appointment
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Scheduled", "Completed", "Cancelled"].map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedStatus === st
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {st ? st : "All Appointments"}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
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
          <h3 className="mt-3 text-sm font-bold text-foreground">No appointments found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Book an appointment with school faculty or staff.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Visitor / Parent</th>
                  <th className="py-3 px-4">Person To Meet</th>
                  <th className="py-3 px-4">Purpose</th>
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
                      <span className="font-bold text-foreground block">{a.visitorName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        {a.visitorMobile}
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-semibold text-foreground block">
                        {a.personToMeetName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {a.departmentName || "Staff"}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">{a.purpose}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          a.status === "Completed"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : a.status === "Cancelled"
                            ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {a.status === "Scheduled" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleComplete(a.id)}
                            className="rounded-xl text-[11px] font-bold h-7 px-2.5"
                          >
                            <CheckCircle2 className="size-3 mr-1" /> Complete
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(a.id)}
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
    </div>
  );
};
