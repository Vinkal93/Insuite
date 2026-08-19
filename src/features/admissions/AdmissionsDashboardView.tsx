import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  UserPlus,
  FileCheck,
  PhoneCall,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  TrendingUp,
  Filter,
  Calendar,
  MessageSquare,
  Sparkles,
  Phone,
  Eye,
  Check,
  ChevronRight,
  Loader2,
  PieChart,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAdmissionDashboardStats,
  completeFollowUp,
  type AdmissionDashboardStats,
} from "@/services/admissionService";
import type { FollowUp } from "@/types/admission";
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

export const AdmissionsDashboardView: React.FC = () => {
  const { organization, selectedSession, firebaseUser, userProfile } = useAuth();
  const [stats, setStats] = useState<AdmissionDashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Complete Follow-up Modal
  const [completingFollowUp, setCompletingFollowUp] = useState<FollowUp | null>(null);
  const [outcome, setOutcome] = useState<FollowUp["outcome"]>("Interested");
  const [notes, setNotes] = useState("");
  const [isSubmittingFollowUp, setIsSubmittingFollowUp] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const data = await getAdmissionDashboardStats(organization.id, selectedSession?.id);
      setStats(data);
    } catch (err) {
      console.error("Error loading admission dashboard stats:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, selectedSession]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleCompleteFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !completingFollowUp || !firebaseUser) return;
    setIsSubmittingFollowUp(true);
    try {
      await completeFollowUp(
        organization.id,
        completingFollowUp.id,
        outcome,
        notes,
        { uid: firebaseUser.uid, name: userProfile?.displayName || "Admin" }
      );
      setCompletingFollowUp(null);
      setNotes("");
      await fetchStats();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingFollowUp(false);
    }
  };

  if (isLoading || !stats) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Enquiries", value: stats.totalEnquiries, href: "/admissions/enquiries", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40" },
    { label: "New Enquiries", value: stats.newEnquiries, href: "/admissions/enquiries", color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40" },
    { label: "Follow-ups Due", value: stats.followUpsDue, href: "/admissions/follow-ups", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40" },
    { label: "Applications", value: stats.totalApplications, href: "/admissions/applications", color: "text-purple-600 bg-purple-50 dark:bg-purple-950/40" },
    { label: "Pending Docs", value: stats.pendingVerification, href: "/admissions/documents", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40" },
    { label: "Approved Apps", value: stats.approvedApplications, href: "/admissions/applications", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40" },
    { label: "Admissions Completed", value: stats.admissionsCompleted, href: "/admissions/admitted", color: "text-teal-600 bg-teal-50 dark:bg-teal-950/40" },
    { label: "Rejected", value: stats.rejectedApplications, href: "/admissions/applications", color: "text-gray-600 bg-gray-50 dark:bg-gray-950/40" },
  ];

  const funnelStages = [
    { label: "Enquiry", count: stats.funnel.enquiry, href: "/admissions/enquiries" },
    { label: "Contacted", count: stats.funnel.contacted, href: "/admissions/enquiries" },
    { label: "Counselling", count: stats.funnel.counselling, href: "/admissions/counselling" },
    { label: "Application", count: stats.funnel.application, href: "/admissions/applications" },
    { label: "Verification", count: stats.funnel.verification, href: "/admissions/documents" },
    { label: "Approved", count: stats.funnel.approved, href: "/admissions/applications" },
    { label: "Admitted", count: stats.funnel.admitted, href: "/admissions/admitted" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 border-b border-border pb-5 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight">Admissions CRM</h1>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary">
              Session {selectedSession?.name || "2026-27"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Track enquiries, counselling pipeline, applications, and verified admissions in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/admissions/enquiries/new">
              <PhoneCall className="size-3.5 mr-1.5 text-primary" /> + New Enquiry
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/admissions/applications/new">
              <UserPlus className="size-3.5 mr-1.5" /> + New Application
            </Link>
          </Button>
        </div>
      </div>

      {/* 8 Clickable Stat Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card, i) => (
          <Link
            key={i}
            to={card.href}
            className="flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:border-primary/40 hover:shadow-lift"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                {card.label}
              </span>
              <span className={`grid size-7 place-items-center rounded-lg text-xs font-extrabold ${card.color}`}>
                {card.value}
              </span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <p className="font-display text-2xl font-extrabold text-foreground">{card.value}</p>
              <ArrowRight className="size-3.5 text-muted-foreground opacity-50 transition-transform group-hover:translate-x-1" />
            </div>
          </Link>
        ))}
      </div>

      {/* Visual Admission Funnel */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Admission Conversion Funnel</h2>
            <p className="text-xs text-muted-foreground">Lead lifecycle pipeline across all acquisition channels</p>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            End-to-End Pipeline
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
          {funnelStages.map((stage, i) => (
            <Link
              key={i}
              to={stage.href}
              className="flex flex-col items-center justify-between rounded-2xl border border-border bg-surface p-3 text-center transition-all hover:border-primary/40 hover:bg-card"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {stage.label}
              </span>
              <span className="mt-2 font-display text-xl font-extrabold text-primary">
                {stage.count}
              </span>
              <span className="mt-1 text-[9px] text-muted-foreground">
                Step {i + 1}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Section: Sources Analytics & Today's Follow-ups */}
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: Today's Follow-ups & Recent Admissions */}
        <div className="space-y-6">
          {/* Today's Follow-ups Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <h3 className="text-sm font-extrabold text-foreground">Follow-ups Due Today</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary font-bold">
                <Link to="/admissions/follow-ups">
                  View All ({stats.followUpsDue}) <ArrowRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>

            {stats.todayFollowUps.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No follow-ups due for today. Click below to add follow-up reminders.
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.todayFollowUps.map((fu) => (
                  <div
                    key={fu.id}
                    className="flex flex-col justify-between gap-3 rounded-2xl border border-border bg-surface p-3.5 sm:flex-row sm:items-center"
                  >
                    <div>
                      <p className="font-bold text-xs text-foreground">{fu.studentName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                        <span>Parent: {fu.parentName}</span>
                        <span>•</span>
                        <span className="font-mono">{fu.mobile}</span>
                      </p>
                      <p className="text-[10px] text-primary mt-0.5 font-medium">Purpose: {fu.purpose}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-[11px]">
                        <a href={`tel:${fu.mobile}`}>
                          <Phone className="size-3 mr-1" /> Call
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-[11px]">
                        <a href={`https://wa.me/${fu.mobile.replace(/[^0-9]/g, "")}`} target="_blank" rel="noreferrer">
                          <MessageSquare className="size-3 mr-1" /> WhatsApp
                        </a>
                      </Button>
                      <Button
                        variant="hero"
                        size="sm"
                        onClick={() => setCompletingFollowUp(fu)}
                        className="h-7 rounded-lg text-[11px] font-bold"
                      >
                        <Check className="size-3 mr-1" /> Done
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Admissions Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="size-4 text-success" />
                <h3 className="text-sm font-extrabold text-foreground">Recent Verified Admissions</h3>
              </div>
              <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary font-bold">
                <Link to="/admissions/admitted">
                  View All Directory <ArrowRight className="size-3 ml-1" />
                </Link>
              </Button>
            </div>

            {stats.recentAdmissions.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No admissions finalized yet. Approved applications will appear here once converted.
              </div>
            ) : (
              <div className="space-y-2">
                {stats.recentAdmissions.map((adm) => (
                  <div
                    key={adm.id}
                    className="flex items-center justify-between rounded-2xl border border-border bg-surface p-3 text-xs"
                  >
                    <div>
                      <p className="font-bold text-foreground">{adm.studentName}</p>
                      <p className="text-[11px] text-muted-foreground">
                        Class: <strong className="text-foreground">{adm.className}</strong> • Adm No: <span className="font-mono text-primary font-bold">{adm.admissionNumber}</span>
                      </p>
                    </div>
                    <Button variant="outline" size="sm" asChild className="h-7 rounded-lg text-xs">
                      <Link to="/admissions/admitted/$admissionId" params={{ admissionId: adm.id }}>
                        <Eye className="size-3 mr-1" /> Details
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Enquiry Sources Analytics */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <PieChart className="size-4 text-primary" />
                <h3 className="text-sm font-extrabold text-foreground">Lead Sources</h3>
              </div>
            </div>

            {stats.sources.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No lead sources recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {stats.sources.map((s, i) => (
                  <div key={i} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold">
                      <span>{s.source}</span>
                      <span className="font-bold text-primary">{s.count} enquiries</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full"
                        style={{ width: `${Math.min(100, (s.count / stats.totalEnquiries) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Follow-up Modal */}
      {completingFollowUp && (
        <Dialog open={!!completingFollowUp} onOpenChange={(open) => !open && setCompletingFollowUp(null)}>
          <DialogContent className="sm:max-w-md">
            <form onSubmit={handleCompleteFollowUp}>
              <DialogHeader>
                <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Check className="size-6" />
                </div>
                <DialogTitle className="text-center font-bold">Complete Follow-up</DialogTitle>
                <DialogDescription className="text-center text-xs">
                  Record outcome for <strong className="text-foreground">{completingFollowUp.studentName}</strong>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div>
                  <Label className="text-xs font-semibold">Call / Meeting Outcome *</Label>
                  <select
                    value={outcome}
                    onChange={(e) => setOutcome(e.target.value as any)}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-medium"
                  >
                    <option value="Interested">Interested — Send Brochure/Details</option>
                    <option value="Application Started">Application Started</option>
                    <option value="Admission Ready">Admission Ready — Ready for Enrollment</option>
                    <option value="Call Back">Call Back Later</option>
                    <option value="No Response">No Response / Ringing</option>
                    <option value="Not Interested">Not Interested / Chose Other School</option>
                  </select>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Discussion Notes</Label>
                  <Textarea
                    placeholder="Enter summary of discussion with parent..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="rounded-xl border-border bg-surface text-xs min-h-[70px]"
                  />
                </div>
              </div>

              <DialogFooter className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setCompletingFollowUp(null)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="submit" variant="hero" size="sm" disabled={isSubmittingFollowUp} className="rounded-xl font-bold">
                  {isSubmittingFollowUp ? <Loader2 className="size-3.5 animate-spin mr-1" /> : null}
                  Save Follow-up
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
