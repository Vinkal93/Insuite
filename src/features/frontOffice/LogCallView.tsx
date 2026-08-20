import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, PhoneCall, PhoneIncoming, PhoneOutgoing, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { logFrontOfficeCall } from "@/services/frontOfficeService";
import type { CallDirection, CallStatus } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const LogCallView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [callerName, setCallerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [direction, setDirection] = useState<CallDirection>("Incoming");
  const [purpose, setPurpose] = useState("");
  const [personToMeetName, setPersonToMeetName] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<CallStatus>("Resolved");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !callerName.trim() || !mobile.trim() || !purpose.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await logFrontOfficeCall(
        organization.id,
        {
          callerName: callerName.trim(),
          mobile: mobile.trim(),
          email: email.trim(),
          direction,
          purpose: purpose.trim(),
          personToMeetName: personToMeetName.trim(),
          departmentName: departmentName.trim(),
          notes: notes.trim(),
          followUpDate: followUpDate || undefined,
          status,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Receptionist" }
      );
      alert(`Call log for ${callerName} saved.`);
      navigate({ to: "/front-office/calls" });
    } catch (err: any) {
      alert("Failed to log call: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/front-office/calls"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Log Telephonic Call</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Record front desk call details, enquiries, and follow-up reminders.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Call Direction *</label>
            <div className="flex gap-2">
              {(["Incoming", "Outgoing"] as CallDirection[]).map((d) => (
                <button
                  type="button"
                  key={d}
                  onClick={() => setDirection(d)}
                  className={`flex-1 py-2 rounded-2xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    direction === d
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-surface border border-border text-muted-foreground"
                  }`}
                >
                  {d === "Incoming" ? <PhoneIncoming className="size-3.5" /> : <PhoneOutgoing className="size-3.5" />}
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CallStatus)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="Resolved">Resolved</option>
              <option value="Open">Open</option>
              <option value="Follow-up">Follow-up Required</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Caller / Contact Name *</label>
            <input
              type="text"
              required
              value={callerName}
              onChange={(e) => setCallerName(e.target.value)}
              placeholder="e.g. Anand Kumar"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Phone Number *</label>
            <input
              type="tel"
              required
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Call Purpose / Subject *</label>
          <input
            type="text"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            placeholder="e.g. Bus route inquiry, Admission brochure request"
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Staff / Department Referred</label>
            <input
              type="text"
              value={personToMeetName}
              onChange={(e) => setPersonToMeetName(e.target.value)}
              placeholder="e.g. Accounts Office / Transport Incharge"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Follow-up Date (if needed)</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Discussion Notes</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes on what was discussed or information provided..."
            className="w-full rounded-2xl border border-border bg-surface p-3 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !callerName.trim() || !mobile.trim() || !purpose.trim()}
            className="rounded-xl text-xs font-bold"
          >
            <Save className="size-3.5 mr-1.5" />
            {isSubmitting ? "Saving..." : "Save Call Log"}
          </Button>
        </div>
      </form>
    </div>
  );
};
