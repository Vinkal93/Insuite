import React, { useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { ArrowLeft, Mail, Save } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createCorrespondence } from "@/services/frontOfficeService";
import type { CorrespondenceType, CorrespondenceStatus } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const AddCorrespondenceView: React.FC = () => {
  const navigate = useNavigate();
  const { organization, firebaseUser, userProfile } = useAuth();

  const [type, setType] = useState<CorrespondenceType>("Incoming Mail");
  const [referenceNumber, setReferenceNumber] = useState("");
  const todayStr = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(todayStr);
  const [sender, setSender] = useState("");
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [status, setStatus] = useState<CorrespondenceStatus>("Received");

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !sender.trim() || !recipient.trim() || !subject.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await createCorrespondence(
        organization.id,
        {
          type,
          referenceNumber: referenceNumber.trim() || undefined,
          date,
          sender: sender.trim(),
          recipient: recipient.trim(),
          subject: subject.trim(),
          description: description.trim(),
          departmentName: departmentName.trim(),
          status,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Receptionist" }
      );
      alert(`Postal correspondence entry created.`);
      navigate({ to: "/front-office/correspondence" });
    } catch (err: any) {
      alert("Failed to save correspondence: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/front-office/correspondence"
          className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" />
        </Link>
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground">Log Postal / Courier Entry</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register incoming and outgoing packages, official government letters, and courier dockets.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Correspondence Type *</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as CorrespondenceType)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="Incoming Mail">Incoming Mail</option>
              <option value="Outgoing Mail">Outgoing Mail</option>
              <option value="Courier">Courier / Speed Post</option>
              <option value="Parcel">Parcel / Package</option>
              <option value="Official Letter">Official Education Board Letter</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Status *</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as CorrespondenceStatus)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              <option value="Received">Received</option>
              <option value="Forwarded">Forwarded to Department</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Delivered">Delivered</option>
              <option value="Returned">Returned</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Reference / Tracking Docket No</label>
            <input
              type="text"
              value={referenceNumber}
              onChange={(e) => setReferenceNumber(e.target.value)}
              placeholder="e.g. DTDC-12345678"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Date *</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">From / Sender Name *</label>
            <input
              type="text"
              required
              value={sender}
              onChange={(e) => setSender(e.target.value)}
              placeholder="e.g. CBSE Regional Office"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">To / Recipient Name *</label>
            <input
              type="text"
              required
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="e.g. Principal / Examination Cell"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-foreground mb-1">Subject / Item Title *</label>
          <input
            type="text"
            required
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Annual Olympiad Examination Question Booklets"
            className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="block font-semibold text-foreground mb-1">Recipient Department</label>
            <input
              type="text"
              value={departmentName}
              onChange={(e) => setDepartmentName(e.target.value)}
              placeholder="e.g. Examination Cell / Accounts"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-semibold text-foreground mb-1">Item Description / Package Details</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Sealed wooden crate containing 200 copies"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-border flex justify-end">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || !sender.trim() || !recipient.trim() || !subject.trim()}
            className="rounded-xl text-xs font-bold"
          >
            <Save className="size-3.5 mr-1.5" />
            {isSubmitting ? "Saving..." : "Save Postal Record"}
          </Button>
        </div>
      </form>
    </div>
  );
};
