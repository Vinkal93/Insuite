import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  PhoneCall,
  User,
  Calendar,
  Clock,
  MessageSquare,
  ArrowLeft,
  FileCheck,
  XCircle,
  Plus,
  Loader2,
  AlertCircle,
  Phone,
  MapPin,
  Check,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getEnquiry,
  updateEnquiry,
  listFollowUps,
  createFollowUp,
  completeFollowUp,
} from "@/services/admissionService";
import type { Enquiry, FollowUp, EnquiryStatus } from "@/types/admission";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface EnquiryProfileViewProps {
  enquiryId: string;
}

export const EnquiryProfileView: React.FC<EnquiryProfileViewProps> = ({ enquiryId }) => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add Follow-up Modal
  const [isAddFuOpen, setIsAddFuOpen] = useState(false);
  const [fuDate, setFuDate] = useState("");
  const [fuPurpose, setFuPurpose] = useState("Fee & Curriculum Counseling");
  const [fuMethod, setFuMethod] = useState<"Call" | "WhatsApp" | "Email" | "In Person">("Call");
  const [isSavingFu, setIsSavingFu] = useState(false);

  // Complete Follow-up Modal
  const [completingFu, setCompletingFu] = useState<FollowUp | null>(null);
  const [outcome, setOutcome] = useState<FollowUp["outcome"]>("Interested");
  const [outcomeNotes, setOutcomeNotes] = useState("");
  const [isCompletingFu, setIsCompletingFu] = useState(false);

  const loadData = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const [enqData, fuList] = await Promise.all([
        getEnquiry(organization.id, enquiryId),
        listFollowUps(organization.id, enquiryId),
      ]);
      setEnquiry(enqData);
      setFollowUps(fuList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, enquiryId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleStatusChange = async (newStatus: EnquiryStatus) => {
    if (!organization || !enquiry || !firebaseUser) return;
    await updateEnquiry(
      organization.id,
      enquiry.id,
      { status: newStatus },
      { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
    );
    await loadData();
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !enquiry || !firebaseUser || !fuDate) return;
    setIsSavingFu(true);
    try {
      await createFollowUp(
        organization.id,
        {
          organizationId: organization.id,
          enquiryId: enquiry.id,
          studentName: enquiry.student.fullName,
          parentName: enquiry.parent.fatherName || enquiry.parent.guardianName || "Parent",
          mobile: enquiry.parent.mobile,
          scheduledDate: fuDate,
          contactMethod: fuMethod,
          purpose: fuPurpose,
          status: "Pending",
          createdBy: firebaseUser.uid,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setIsAddFuOpen(false);
      setFuDate("");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingFu(false);
    }
  };

  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !completingFu || !firebaseUser) return;
    setIsCompletingFu(true);
    try {
      await completeFollowUp(
        organization.id,
        completingFu.id,
        outcome,
        outcomeNotes,
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setCompletingFu(null);
      setOutcomeNotes("");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setIsCompletingFu(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!enquiry) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-6">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="mt-3 text-lg font-bold">Enquiry Not Found</h2>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/admissions/enquiries">Back to Enquiries</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
            <Link to="/admissions/enquiries">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{enquiry.student.fullName}</h1>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                {enquiry.enquiryNumber}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground">
                {enquiry.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Interested in: <strong className="text-foreground">{enquiry.student.interestedClass}</strong> • Source: {enquiry.source}
            </p>
          </div>
        </div>

        {/* Action Triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAddFuOpen(true)}
            className="rounded-xl text-xs font-semibold"
          >
            <Clock className="size-3.5 mr-1.5 text-primary" /> + Follow-up
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/admissions/applications/new">
              <FileCheck className="size-3.5 mr-1.5" /> Start Application
            </Link>
          </Button>
          {enquiry.status !== "Lost" && enquiry.status !== "Not Interested" && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleStatusChange("Lost")}
              className="rounded-xl text-xs font-semibold"
            >
              <XCircle className="size-3.5 mr-1" /> Mark Lost
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left Column: Details & Follow-up History */}
        <div className="space-y-6">
          {/* Student & Parent Info */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] border-b border-border pb-2">
                Candidate Information
              </h3>
              <p><span className="text-muted-foreground">Applying Class:</span> <strong className="text-foreground">{enquiry.student.interestedClass}</strong></p>
              {enquiry.student.dob && <p><span className="text-muted-foreground">DOB:</span> {enquiry.student.dob}</p>}
              {enquiry.student.gender && <p><span className="text-muted-foreground">Gender:</span> {enquiry.student.gender}</p>}
              <p><span className="text-muted-foreground">Session:</span> {enquiry.sessionName || "Current"}</p>
            </div>

            <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
              <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] border-b border-border pb-2">
                Parent & Residence
              </h3>
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 text-primary" />
                <span className="font-mono font-bold text-foreground">{enquiry.parent.mobile}</span>
              </div>
              {enquiry.parent.fatherName && <p><span className="text-muted-foreground">Father:</span> {enquiry.parent.fatherName}</p>}
              {enquiry.parent.email && <p><span className="text-muted-foreground">Email:</span> {enquiry.parent.email}</p>}
              {enquiry.address?.addressLine && (
                <div className="flex items-start gap-1.5 pt-1 border-t border-border/60">
                  <MapPin className="size-3.5 text-primary shrink-0 mt-0.5" />
                  <span>{enquiry.address.addressLine}, {enquiry.address.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Follow-up Timeline */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <h3 className="text-sm font-extrabold text-foreground">Follow-up History & Logs</h3>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setIsAddFuOpen(true)} className="h-7 text-xs text-primary font-bold">
                <Plus className="size-3 mr-1" /> Add Reminder
              </Button>
            </div>

            {followUps.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No follow-ups recorded yet for this enquiry.
              </div>
            ) : (
              <div className="space-y-3">
                {followUps.map((fu) => (
                  <div key={fu.id} className="flex flex-col justify-between gap-2 rounded-2xl border border-border bg-surface p-4 text-xs sm:flex-row sm:items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{fu.purpose}</span>
                        <span className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${fu.status === "Completed" ? "bg-success/10 text-success" : "bg-amber-500/10 text-amber-600"}`}>
                          {fu.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Scheduled: <strong className="font-mono text-foreground">{fu.scheduledDate}</strong> via {fu.contactMethod}
                      </p>
                      {fu.outcome && (
                        <p className="text-[10px] text-primary mt-1 font-semibold">Outcome: {fu.outcome} • {fu.outcomeNotes}</p>
                      )}
                    </div>

                    {fu.status === "Pending" && (
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => setCompletingFu(fu)}
                        className="h-7 rounded-lg text-xs font-bold shrink-0"
                      >
                        <Check className="size-3 mr-1" /> Mark Complete
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Counsellor Notes & Quick Status */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] border-b border-border pb-2">
              Lead Management
            </h3>

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Update Lead Status</Label>
              <select
                value={enquiry.status}
                onChange={(e) => handleStatusChange(e.target.value as any)}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
              >
                <option value="New">New Enquiry</option>
                <option value="Contacted">Contacted</option>
                <option value="Counselling">In Counselling</option>
                <option value="Interested">High Interest</option>
                <option value="Application Started">Application Started</option>
                <option value="Converted">Converted to Admission</option>
                <option value="Lost">Lost</option>
                <option value="Not Interested">Not Interested</option>
              </select>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-border">
              <p className="text-muted-foreground">Assigned Counsellor</p>
              <p className="font-bold text-foreground">{enquiry.assignedCounsellorName || "Admin"}</p>
            </div>

            {enquiry.notes && (
              <div className="space-y-1 pt-2 border-t border-border">
                <p className="text-muted-foreground">Initial Inquiry Notes</p>
                <p className="rounded-xl bg-surface p-3 text-foreground leading-relaxed">{enquiry.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Follow-up Modal */}
      {isAddFuOpen && (
        <Dialog open={isAddFuOpen} onOpenChange={setIsAddFuOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleAddFollowUp}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Clock className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Add Follow-up Reminder</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Schedule call / meeting with <strong className="text-foreground">{enquiry.student.fullName}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Scheduled Date *</Label>
                  <Input type="date" required value={fuDate} onChange={(e) => setFuDate(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Contact Method</Label>
                  <select value={fuMethod} onChange={(e) => setFuMethod(e.target.value as any)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                    <option value="Call">Phone Call</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="In Person">Campus Visit</option>
                    <option value="Email">Email</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Purpose</Label>
                  <Input value={fuPurpose} onChange={(e) => setFuPurpose(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsAddFuOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" size="sm" disabled={isSavingFu || !fuDate} className="rounded-xl font-bold">
                  {isSavingFu ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Reminder
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Complete Follow-up Modal */}
      {completingFu && (
        <Dialog open={!!completingFu} onOpenChange={(open) => !open && setCompletingFu(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCompleteFollowUp}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Check className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Complete Follow-up</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Record outcome for follow-up on <strong className="text-foreground">{completingFu.scheduledDate}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Outcome *</Label>
                  <select value={outcome} onChange={(e) => setOutcome(e.target.value as any)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                    <option value="Interested">Interested — Send Details</option>
                    <option value="Application Started">Application Started</option>
                    <option value="Admission Ready">Admission Ready</option>
                    <option value="Call Back">Call Back Later</option>
                    <option value="No Response">No Response</option>
                    <option value="Not Interested">Not Interested</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Discussion Notes</Label>
                  <Textarea value={outcomeNotes} onChange={(e) => setOutcomeNotes(e.target.value)} className="rounded-xl border-border bg-surface text-xs min-h-[70px]" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCompletingFu(null)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" size="sm" disabled={isCompletingFu} className="rounded-xl font-bold">
                  {isCompletingFu ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Save Outcome
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
