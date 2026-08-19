import React, { useState, useEffect } from "react";
import { Link, useParams } from "@tanstack/react-router";
import {
  FileText,
  ArrowLeft,
  Printer,
  CheckCircle2,
  Archive,
  AlertCircle,
  Building2,
  ShieldCheck,
  Calendar,
  Share2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getNotice,
  publishNotice,
  archiveNotice,
} from "@/services/communicationService";
import type { Notice } from "@/types/communication";
import { Button } from "@/components/ui/button";

export const NoticeDetailView: React.FC = () => {
  const { id } = useParams({ strict: false }) as { id?: string };
  const { organization, firebaseUser, userProfile } = useAuth();

  const [notice, setNotice] = useState<Notice | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    if (!organization || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getNotice(organization.id, id);
      setNotice(data);
    } catch (err: any) {
      console.error("Error loading notice:", err);
      setError(err.message || "Failed to load notice.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, id]);

  const handlePublish = async () => {
    if (!organization || !firebaseUser || !notice) return;
    setIsProcessing(true);
    try {
      await publishNotice(organization.id, notice.id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to publish notice: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!organization || !firebaseUser || !notice) return;
    if (!confirm("Are you sure you want to archive this notice?")) return;
    setIsProcessing(true);
    try {
      await archiveNotice(organization.id, notice.id, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      await loadData();
    } catch (err: any) {
      alert("Failed to archive notice: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (error || !notice) {
    return (
      <div className="mx-auto max-w-3xl rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Notice Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "This notice record does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/communication/notices">Back to Notices</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/communication/notices">
            <ArrowLeft className="size-3.5 mr-1" /> Back to Notices
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {notice.status === "Draft" && (
            <Button
              variant="hero"
              size="sm"
              onClick={handlePublish}
              disabled={isProcessing}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <CheckCircle2 className="size-3.5 mr-1.5" /> Publish Notice
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs font-semibold"
          >
            <Printer className="size-3.5 mr-1.5" /> Print / Save PDF
          </Button>
          {notice.status !== "Archived" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isProcessing}
              className="rounded-xl text-xs text-rose-500 hover:bg-rose-500/10"
            >
              <Archive className="size-3.5 mr-1.5" /> Archive
            </Button>
          )}
        </div>
      </div>

      {/* Official Institutional Letterhead & Notice Container */}
      <div className="rounded-3xl border border-border bg-card p-8 sm:p-12 shadow-soft space-y-8 print:border-none print:shadow-none print:p-0 print:m-0 text-foreground">
        {/* School Header */}
        <div className="flex items-start justify-between border-b-2 border-primary/20 pb-6">
          <div className="flex items-center gap-4">
            {organization?.logoUrl ? (
              <img
                src={organization.logoUrl}
                alt="Logo"
                className="size-16 rounded-xl object-contain border border-border"
              />
            ) : (
              <div className="size-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-black text-xl">
                {organization?.name ? organization.name[0] : "I"}
              </div>
            )}
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight text-foreground sm:text-2xl">
                {organization?.name || "InSuite Educational Academy"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {organization?.address || "Campus Main Road"}, {organization?.city || "New Delhi"}, {organization?.state || "Delhi"} - {organization?.postalCode || "110001"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                Affiliation Code: <strong className="text-foreground">{organization?.code || "INS1001"}</strong> | Email: {organization?.email || "admin@insuite.edu"}
              </p>
            </div>
          </div>
        </div>

        {/* Notice Meta Banner */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4 text-xs">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Ref No:</span>
            <p className="font-mono font-black text-primary text-sm">{notice.noticeNumber}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category:</span>
            <p className="font-bold text-foreground">{notice.category}</p>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Audience:</span>
            <p className="font-bold text-foreground">{notice.audienceType}</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date of Issuance:</span>
            <p className="font-mono font-bold text-foreground">{notice.publishDate}</p>
          </div>
        </div>

        {/* Notice Title */}
        <div className="text-center py-2 space-y-1">
          <span className="inline-block rounded-full bg-primary/10 px-4 py-1 text-xs font-black uppercase tracking-widest text-primary">
            OFFICIAL NOTICE
          </span>
          <h2 className="text-lg font-black text-foreground sm:text-xl underline decoration-primary/40 decoration-2 underline-offset-4">
            {notice.title}
          </h2>
        </div>

        {/* Notice Body */}
        <div className="prose prose-sm max-w-none text-foreground text-xs leading-relaxed whitespace-pre-wrap font-sans py-4">
          {notice.content}
        </div>

        {/* Signatory Section */}
        <div className="pt-8 flex justify-end">
          <div className="text-center space-y-1 min-w-[200px]">
            <div className="h-12 border-b border-dashed border-muted-foreground/40 flex items-end justify-center pb-1 text-[10px] text-muted-foreground italic">
              Digital Authorization Validated
            </div>
            <p className="text-xs font-black text-foreground pt-1">{notice.issuedBy}</p>
            <p className="text-[11px] text-muted-foreground font-medium">
              {notice.signatureTitle || "Principal / Authorized Signatory"}
            </p>
            <p className="text-[10px] text-muted-foreground/70 font-mono">
              {organization?.name || "InSuite Academy"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
