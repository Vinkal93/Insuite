import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  FileCheck,
  User,
  Users,
  MapPin,
  GraduationCap,
  Sparkles,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  FileText,
  Clock,
  Check,
  Building2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getApplication,
  updateApplication,
  convertApplicationToAdmission,
} from "@/services/admissionService";
import type { Application, ApplicationStatus } from "@/types/admission";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationReviewViewProps {
  applicationId: string;
}

export const ApplicationReviewView: React.FC<ApplicationReviewViewProps> = ({ applicationId }) => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [app, setApp] = useState<Application | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rejection modal
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("Incomplete Information");
  const [rejectNotes, setRejectNotes] = useState("");
  const [isRejecting, setIsRejecting] = useState(false);

  // Convert to Admission modal
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [sectionId, setSectionId] = useState("Section A");
  const [customAdmNo, setCustomAdmNo] = useState("");
  const [isConverting, setIsConverting] = useState(false);

  const fetchApp = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const data = await getApplication(organization.id, applicationId);
      setApp(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, applicationId]);

  useEffect(() => {
    fetchApp();
  }, [fetchApp]);

  const handleApprove = async () => {
    if (!organization || !app || !firebaseUser) return;
    await updateApplication(
      organization.id,
      app.id,
      { status: "Approved" },
      { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
    );
    await fetchApp();
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !app || !firebaseUser) return;
    setIsRejecting(true);
    try {
      await updateApplication(
        organization.id,
        app.id,
        {
          status: "Rejected",
          rejectionReason: `${rejectReason}: ${rejectNotes}`,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setIsRejectOpen(false);
      await fetchApp();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRejecting(false);
    }
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !app || !firebaseUser) return;
    setIsConverting(true);
    try {
      const res = await convertApplicationToAdmission(
        organization.id,
        app.id,
        {
          sectionId,
          sectionName: sectionId,
          customAdmissionNumber: customAdmNo.trim() || undefined,
        },
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );

      window.location.href = `/admissions/admitted/${res.admissionId}`;
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Failed to convert admission.");
    } finally {
      setIsConverting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-6">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="mt-3 text-lg font-bold">Application Not Found</h2>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/admissions/applications">Back to Applications</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-4 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
            <Link to="/admissions/applications">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{app.student.fullName}</h1>
              <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                {app.applicationNumber}
              </span>
              <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-bold text-foreground">
                {app.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Applied for <strong className="text-foreground">{app.applyingClass}</strong> • Submitted: {app.createdAt.split("T")[0]}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {app.status !== "Approved" && app.status !== "Converted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleApprove}
              className="rounded-xl text-xs font-semibold text-emerald-600 border-emerald-500/30 hover:bg-emerald-50"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" /> Approve Application
            </Button>
          )}

          {app.status !== "Rejected" && app.status !== "Converted" && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectOpen(true)}
              className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <XCircle className="size-3.5 mr-1.5" /> Reject
            </Button>
          )}

          {app.status !== "Converted" && (
            <Button
              variant="hero"
              size="sm"
              onClick={() => setIsConvertOpen(true)}
              className="rounded-xl text-xs font-bold shadow-lift"
            >
              <Building2 className="size-3.5 mr-1.5" /> Convert to Admission
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          {/* Candidate Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <User className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Candidate Profile</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><span className="text-muted-foreground">Full Name:</span> <p className="font-bold text-foreground">{app.student.fullName}</p></div>
              <div><span className="text-muted-foreground">Date of Birth:</span> <p className="font-medium text-foreground">{app.student.dob}</p></div>
              <div><span className="text-muted-foreground">Gender:</span> <p className="font-medium text-foreground">{app.student.gender}</p></div>
              <div><span className="text-muted-foreground">Blood Group:</span> <p className="font-medium text-foreground">{app.student.bloodGroup || "—"}</p></div>
              <div><span className="text-muted-foreground">Nationality:</span> <p className="font-medium text-foreground">{app.student.nationality}</p></div>
              <div><span className="text-muted-foreground">Category:</span> <p className="font-medium text-foreground">{app.student.category}</p></div>
            </div>
          </div>

          {/* Parents Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <Users className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Parents & Residence</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div><span className="text-muted-foreground">Father's Name:</span> <p className="font-bold text-foreground">{app.parent.fatherName || "—"}</p></div>
              <div><span className="text-muted-foreground">Mother's Name:</span> <p className="font-bold text-foreground">{app.parent.motherName || "—"}</p></div>
              <div><span className="text-muted-foreground">Primary Mobile:</span> <p className="font-mono font-bold text-foreground">{app.contact.mobile}</p></div>
              <div><span className="text-muted-foreground">Email:</span> <p className="text-foreground">{app.contact.email || "—"}</p></div>
              <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> <p className="text-foreground">{app.contact.addressLine}, {app.contact.city}</p></div>
            </div>
          </div>

          {/* Academic Background Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3 text-xs">
            <div className="flex items-center gap-2 border-b border-border pb-3">
              <GraduationCap className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Previous Academic Record</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div><span className="text-muted-foreground">Previous School:</span> <p className="font-bold text-foreground">{app.academicHistory.previousSchool || "—"}</p></div>
              <div><span className="text-muted-foreground">Board:</span> <p className="font-medium text-foreground">{app.academicHistory.previousBoard || "—"}</p></div>
              <div><span className="text-muted-foreground">Marks / Percentage:</span> <p className="font-medium text-foreground">{app.academicHistory.previousGradePercentage || "—"}</p></div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Status Review Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] border-b border-border pb-2">
              Review Status
            </h3>

            <div className="space-y-2">
              <p className="text-muted-foreground">Applying Class Placement</p>
              <p className="text-sm font-bold text-primary">{app.applyingClass}</p>
              <p className="text-[11px] text-muted-foreground">Section Preference: {app.sectionPreference || "Section A"}</p>
            </div>

            {app.rejectionReason && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-destructive">
                <p className="font-bold">Rejection Note:</p>
                <p className="mt-0.5">{app.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {isRejectOpen && (
        <Dialog open={isRejectOpen} onOpenChange={setIsRejectOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleReject}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-destructive/10 text-destructive">
                  <XCircle className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Reject Application</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  State justification for rejecting application of <strong className="text-foreground">{app.student.fullName}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Rejection Category *</Label>
                  <select value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                    <option value="Incomplete Information">Incomplete Information</option>
                    <option value="Documents Invalid">Documents Invalid / Verification Failed</option>
                    <option value="Eligibility Criteria Not Met">Eligibility Criteria Not Met</option>
                    <option value="Class Seats Full">Class Seats Full</option>
                    <option value="Other">Other Reason</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Additional Remarks</Label>
                  <Textarea value={rejectNotes} onChange={(e) => setRejectNotes(e.target.value)} className="rounded-xl border-border bg-surface text-xs min-h-[60px]" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsRejectOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="destructive" size="sm" disabled={isRejecting} className="rounded-xl font-bold">
                  {isRejecting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Confirm Rejection
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Convert to Admission Modal */}
      {isConvertOpen && (
        <Dialog open={isConvertOpen} onOpenChange={setIsConvertOpen}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleConvert}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Building2 className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Finalize School Admission</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  This will generate permanent Student ID and enroll <strong className="text-foreground">{app.student.fullName}</strong> into active directory.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Assign Section *</Label>
                  <select value={sectionId} onChange={(e) => setSectionId(e.target.value)} className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium">
                    <option value="Section A">Section A</option>
                    <option value="Section B">Section B</option>
                    <option value="Section C">Section C</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Custom Admission Number (Optional)</Label>
                  <Input placeholder="Leave blank to auto-generate (e.g. ADM-2026-0001)" value={customAdmNo} onChange={(e) => setCustomAdmNo(e.target.value)} className="rounded-xl border-border bg-surface text-xs" />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setIsConvertOpen(false)} className="rounded-xl">Cancel</Button>
                <Button type="submit" variant="hero" size="sm" disabled={isConverting} className="rounded-xl font-bold">
                  {isConverting ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null} Complete Admission
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
