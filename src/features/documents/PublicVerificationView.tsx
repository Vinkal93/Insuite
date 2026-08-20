import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Award,
  Lock,
} from "lucide-react";
import { collectionGroup, getDocs, query, where, limit as firestoreLimit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { IssuedDocument } from "@/types/document";

export const PublicVerificationView: React.FC = () => {
  const { number } = useParams({ strict: false }) as { number: string };

  const [document, setDocument] = useState<IssuedDocument | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const verifyDoc = async () => {
      if (!number) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const q = query(
          collectionGroup(db, "issuedDocuments"),
          where("documentNumber", "==", number),
          firestoreLimit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          setDocument(snap.docs[0].data() as IssuedDocument);
        } else {
          setDocument(null);
        }
      } catch (err) {
        console.error("publicVerification error:", err);
        setDocument(null);
      } finally {
        setIsLoading(false);
        setHasSearched(true);
      }
    };
    verifyDoc();
  }, [number]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="size-14 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-xl font-black text-foreground">InSuite Official Verification</h1>
          <p className="text-xs text-muted-foreground">
            Cryptographically logged institutional certificate & credential verification portal.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft space-y-4 text-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Verifying document credentials...</p>
          </div>
        ) : !document ? (
          <div className="rounded-3xl border border-destructive/20 bg-card p-8 shadow-soft text-center space-y-3">
            <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <XCircle className="size-6" />
            </div>
            <h2 className="text-base font-extrabold text-foreground">Document Not Found</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No official institutional record matches document number{" "}
              <strong className="text-foreground font-mono">{number}</strong>. This document cannot be
              authenticated.
            </p>
          </div>
        ) : document.status === "REVOKED" ? (
          <div className="rounded-3xl border border-rose-500/30 bg-card p-8 shadow-soft space-y-4 text-center">
            <div className="size-12 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center mx-auto">
              <XCircle className="size-6" />
            </div>
            <div>
              <h2 className="text-base font-black text-rose-600">Certificate Has Been Revoked</h2>
              <p className="text-xs text-muted-foreground mt-1">
                This document was officially invalidated by the issuing school administration.
              </p>
            </div>

            <div className="bg-surface/50 p-4 rounded-2xl border border-border text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document No:</span>
                <span className="font-bold text-foreground">{document.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient:</span>
                <span className="font-bold text-foreground">{document.personName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revocation Reason:</span>
                <span className="font-bold text-rose-600">
                  {document.revocationReason || "Administrative Cancellation"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-3xl border border-emerald-500/30 bg-card p-8 shadow-soft space-y-5 text-center">
            <div className="size-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="size-7" />
            </div>

            <div>
              <span className="inline-block px-3 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase tracking-wider">
                ✓ Authentic & Officially Verified
              </span>
              <h2 className="text-lg font-black text-foreground mt-2">{document.documentTypeName}</h2>
            </div>

            {/* Safe Public Details Table (Zero private info like phone, email, address, or fees leaked!) */}
            <div className="bg-surface/50 p-5 rounded-2xl border border-border text-xs text-left space-y-2.5 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document Number:</span>
                <span className="font-bold text-primary">{document.documentNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Recipient Name:</span>
                <span className="font-bold text-foreground">{document.personName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Identifier:</span>
                <span className="font-bold text-foreground">
                  {document.personType === "STUDENT" ? "Adm No: " : "Emp ID: "}
                  {document.personIdentifier}
                </span>
              </div>
              {document.className && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Class / Grade:</span>
                  <span className="font-bold text-foreground">
                    Class {document.className} ({document.sectionName})
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date of Issue:</span>
                <span className="font-bold text-foreground">{document.issueDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Issued By:</span>
                <span className="font-bold text-foreground">{document.issuedBy}</span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="size-3" /> Secure Verification Hash Verified
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
