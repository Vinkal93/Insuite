import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Award,
  Printer,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getIssuedDocument, revokeDocument } from "@/services/documentService";
import type { IssuedDocument } from "@/types/document";
import { Button } from "@/components/ui/button";

export const CertificateDetailView: React.FC = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  const { organization, firebaseUser, userProfile } = useAuth();

  const [document, setDocument] = useState<IssuedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDocument = async () => {
    if (!organization || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const docData = await getIssuedDocument(organization.id, id);
      setDocument(docData);
    } catch (err: any) {
      console.error("loadDocumentDetail error:", err);
      setError(err.message || "Failed to load document.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDocument();
  }, [organization, id]);

  const handlePrint = () => {
    window.print();
  };

  const handleRevoke = async () => {
    if (!document || !organization || !firebaseUser) return;
    const reason = prompt(`Enter reason to revoke certificate ${document.documentNumber}:`);
    if (!reason) return;

    try {
      await revokeDocument(organization.id, document.id, reason, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      alert(`Certificate ${document.documentNumber} has been revoked.`);
      await loadDocument();
    } catch (err: any) {
      alert("Failed to revoke: " + err.message);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !document) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error || "Document not found."}</p>
        <Link
          to="/documents/certificates"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Return to Certificates
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Controls Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/documents/certificates"
            className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground">{document.documentTypeName}</h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                  document.status === "ISSUED"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                }`}
              >
                {document.status}
              </span>
            </div>
            <p className="text-xs text-muted-foreground font-mono">
              Certificate No: {document.documentNumber}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="hero"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl text-xs font-bold"
          >
            <Printer className="size-3.5 mr-1.5" /> Print / Save PDF
          </Button>

          {document.status === "ISSUED" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevoke}
              className="rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50"
            >
              <XCircle className="size-3.5 mr-1.5" /> Revoke
            </Button>
          )}
        </div>
      </div>

      {document.status === "REVOKED" && (
        <div className="print:hidden p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-semibold">
          <p className="font-bold">This certificate has been revoked.</p>
          <p className="text-[11px] mt-0.5">
            Reason: {document.revocationReason || "Administrative decision"} (Revoked by{" "}
            {document.revokedBy || "Admin"})
          </p>
        </div>
      )}

      {/* Official Certificate Paper Sheet (A4 Proportion) */}
      <div className="bg-card text-foreground border-4 border-double border-border rounded-3xl p-8 sm:p-14 shadow-lg space-y-8 relative overflow-hidden print:border-black print:shadow-none print:m-0 print:p-8">
        {/* Watermark */}
        <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] select-none pointer-events-none text-8xl font-black rotate-[-30deg]">
          {organization?.name || "OFFICIAL"}
        </div>

        {/* School Letterhead Header */}
        <div className="text-center space-y-2 border-b-2 border-border pb-6">
          <div className="size-16 rounded-2xl bg-primary/10 text-primary font-black text-2xl flex items-center justify-center mx-auto border border-primary/20">
            {organization?.name?.charAt(0) || "S"}
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-wide text-foreground uppercase">
            {organization?.name || "School of Excellence"}
          </h2>
          <p className="text-xs text-muted-foreground font-semibold">
            Affiliated to Central Educational Board • School Code: {organization?.code || "INS-001"}
          </p>
        </div>

        {/* Certificate Metadata */}
        <div className="flex items-center justify-between text-xs font-mono text-muted-foreground border-b border-border/50 pb-3">
          <div>
            <span className="font-bold text-foreground">Cert No: </span>
            <span className="text-primary font-bold">{document.documentNumber}</span>
          </div>
          <div>
            <span className="font-bold text-foreground">Date of Issue: </span>
            <span>{document.issueDate}</span>
          </div>
        </div>

        {/* Certificate Title */}
        <div className="text-center space-y-1">
          <h3 className="text-lg sm:text-xl font-black uppercase tracking-widest text-primary underline underline-offset-8">
            {document.documentTypeName}
          </h3>
        </div>

        {/* Compiled Body Content */}
        <div className="text-sm leading-loose whitespace-pre-line text-foreground/90 font-serif px-2 sm:px-6">
          {document.compiledContent}
        </div>

        {/* Signatures & QR Section */}
        <div className="pt-12 grid grid-cols-2 sm:grid-cols-3 items-end gap-6 border-t border-border">
          {/* QR Verification Block */}
          <div className="space-y-1">
            <div className="size-20 border border-border rounded-xl bg-surface/80 flex items-center justify-center p-1.5 shadow-sm">
              <QrCode className="size-16 text-foreground" />
            </div>
            <span className="text-[9px] font-mono text-muted-foreground block">
              Scan to Verify Online
            </span>
          </div>

          {/* School Stamp Seal */}
          <div className="hidden sm:flex flex-col items-center justify-center">
            <div className="size-20 rounded-full border-2 border-dashed border-primary/40 flex items-center justify-center text-[10px] font-bold text-primary text-center uppercase p-2">
              Official Institutional Seal
            </div>
          </div>

          {/* Authorized Signatory */}
          <div className="text-right space-y-1">
            <div className="h-10 border-b border-foreground/40 w-36 ml-auto" />
            <p className="text-xs font-extrabold text-foreground">{document.issuedBy || "Principal"}</p>
            <p className="text-[10px] text-muted-foreground font-semibold">Head of Institution</p>
          </div>
        </div>
      </div>
    </div>
  );
};
