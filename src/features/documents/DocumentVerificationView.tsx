import React, { useState } from "react";
import { ShieldCheck, Search, CheckCircle2, XCircle, AlertCircle, Award } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { verifyDocumentPublic, type PublicVerificationResult } from "@/services/documentService";
import { Button } from "@/components/ui/button";

export const DocumentVerificationView: React.FC = () => {
  const { organization } = useAuth();
  const [docNumber, setDocNumber] = useState("");
  const [result, setResult] = useState<PublicVerificationResult | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !docNumber.trim()) return;

    setIsVerifying(true);
    setHasSearched(true);
    try {
      const res = await verifyDocumentPublic(organization.id, docNumber.trim());
      setResult(res);
    } catch (err: any) {
      console.error("verify error:", err);
      setResult(null);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Document Verification Portal
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Verify authenticity of issued certificates and student/staff identification credentials.
        </p>
      </div>

      {/* Verification Search Box */}
      <form onSubmit={handleVerify} className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-foreground mb-1">
            Certificate or Document Number *
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              required
              value={docNumber}
              onChange={(e) => setDocNumber(e.target.value)}
              placeholder="e.g. INS-CERT-2026-000001"
              className="flex-1 rounded-2xl border border-border bg-surface px-3.5 py-2.5 text-xs font-mono font-bold text-foreground focus:border-primary focus:outline-none"
            />
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isVerifying || !docNumber.trim()}
              className="rounded-2xl text-xs font-bold px-5"
            >
              <ShieldCheck className="size-4 mr-1.5" />
              {isVerifying ? "Verifying..." : "Verify"}
            </Button>
          </div>
        </div>
      </form>

      {/* Verification Result */}
      {hasSearched && (
        <div>
          {!result ? (
            <div className="rounded-3xl border border-destructive/20 bg-card p-6 shadow-soft text-center space-y-2">
              <XCircle className="size-8 text-destructive mx-auto" />
              <h3 className="text-sm font-extrabold text-foreground">Document Not Found</h3>
              <p className="text-xs text-muted-foreground">
                No official record matching <strong>{docNumber}</strong> was found.
              </p>
            </div>
          ) : result.isRevoked ? (
            <div className="rounded-3xl border border-rose-500/20 bg-card p-6 shadow-soft text-center space-y-3">
              <XCircle className="size-8 text-rose-600 mx-auto" />
              <h3 className="text-sm font-extrabold text-rose-600">Certificate Has Been Revoked</h3>
              <p className="text-xs text-muted-foreground">
                Reason: {result.revocationReason || "Cancelled by school administration."}
              </p>
            </div>
          ) : (
            <div className="rounded-3xl border border-emerald-500/20 bg-card p-6 shadow-soft space-y-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="size-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-foreground">{result.documentTypeName}</h3>
                  <span className="text-[10px] font-bold text-emerald-600">
                    ✓ Valid & Officially Authenticated
                  </span>
                </div>
              </div>

              <div className="bg-surface/50 p-4 rounded-2xl border border-border text-xs space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Document Number:</span>
                  <span className="font-bold text-primary">{result.documentNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Recipient Name:</span>
                  <span className="font-bold text-foreground">{result.personName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Identifier:</span>
                  <span className="font-bold text-foreground">{result.personIdentifier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Issue Date:</span>
                  <span className="font-bold text-foreground">{result.issueDate}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
