import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, CalendarCheck, Clock, User, AlertCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createFrontOfficeAppointment } from "@/services/frontOfficeService";
import { listStaff } from "@/services/hrService";
import type { Staff } from "@/types/staff";
import { Button } from "@/components/ui/button";

export const CreateFrontOfficeAppointmentView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [visitorName, setVisitorName] = useState("");
  const [visitorMobile, setVisitorMobile] = useState("");
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [selectedStaffName, setSelectedStaffName] = useState("");
  const [departmentName, setDepartmentName] = useState("");

  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("10:30");
  const [purpose, setPurpose] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStaff = async () => {
      if (!organization) return;
      try {
        const list = await listStaff(organization.id);
        setStaffList(list);
        if (list.length > 0) {
          setSelectedStaffId(list[0].id);
          setSelectedStaffName(list[0].fullName);
          setDepartmentName(list[0].department || "Academics");
        }
      } catch (err) {
        console.error("loadStaff error:", err);
      }
    };
    loadStaff();
  }, [organization]);

  const handleStaffChange = (staffId: string) => {
    setSelectedStaffId(staffId);
    const s = staffList.find((x) => x.id === staffId);
    if (s) {
      setSelectedStaffName(s.fullName);
      setDepartmentName(s.department || "Academics");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !visitorName.trim() || !purpose.trim()) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await createFrontOfficeAppointment(
        organization.id,
        {
          visitorName: visitorName.trim(),
          visitorMobile: visitorMobile.trim(),
          personToMeetId: selectedStaffId || "admin",
          personToMeetName: selectedStaffName || "School Administration",
          departmentName,
          date,
          startTime,
          endTime,
          purpose: purpose.trim(),
          notes: notes.trim(),
          status: "Scheduled",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Receptionist" }
      );
      alert(`Appointment scheduled for ${visitorName} on ${date} at ${startTime}.`);
      navigate({ to: "/front-office/appointments" });
    } catch (err: any) {
      setError(err.message || "Failed to schedule appointment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/front-office/appointments"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Schedule Appointment</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Book meeting slot with Principal, administration, or teacher with instant conflict detection.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl border border-destructive/20 bg-destructive/5 text-xs text-destructive font-bold flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Visitor / Parent Name *</label>
            <input
              type="text"
              required
              value={visitorName}
              onChange={(e) => setVisitorName(e.target.value)}
              placeholder="e.g. Mrs. Sunita Sharma"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Mobile Contact *</label>
            <input
              type="tel"
              required
              value={visitorMobile}
              onChange={(e) => setVisitorMobile(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Person To Meet *</label>
          <select
            value={selectedStaffId}
            onChange={(e) => handleStaffChange(e.target.value)}
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
          >
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} ({s.designation || "Staff"} • {s.department || "General"})
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="block font-semibold text-foreground mb-1">Meeting Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Start Time *</label>
            <input
              type="time"
              required
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">End Time *</label>
            <input
              type="time"
              required
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Purpose of Appointment *</label>
          <input
            type="text"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Admission inquiry, Academic progress discussion"
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Additional Notes</label>
          <textarea
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Key discussion points or student reference..."
            className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !visitorName.trim() || !purpose.trim()}
            className="rounded-xl text-xs font-bold"
          >
            <CalendarCheck className="size-3.5 mr-1.5" />
            {isSubmitting ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </div>
      </form>
    </div>
  );
};
