import React, { useState, useEffect } from "react";
import { useParams } from "@tanstack/react-router";
import { ShieldCheck, CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import { collectionGroup, getDocs, query, where, limit as firestoreLimit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { FrontOfficeGatePass } from "@/types/frontOffice";

export const PublicGatePassVerificationView: React.FC = () => {
  const { passNumber } = useParams({ strict: false }) as { passNumber: string };

  const [pass, setPass] = useState<FrontOfficeGatePass | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyPass = async () => {
      if (!passNumber) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const q = query(
          collectionGroup(db, "frontOfficeGatePasses"),
          where("passNumber", "==", passNumber),
          firestoreLimit(1)
        );
        const snap = await getDocs(q);

        if (!snap.empty) {
          setPass(snap.docs[0].data() as FrontOfficeGatePass);
        } else {
          setPass(null);
        }
      } catch (err) {
        console.error("verifyGatePass error:", err);
        setPass(null);
      } finally {
        setIsLoading(false);
      }
    };
    verifyPass();
  }, [passNumber]);

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-1">
          <div className="size-14 rounded-2xl bg-primary text-primary-foreground font-black text-2xl flex items-center justify-center mx-auto shadow-md">
            <ShieldCheck className="size-8" />
          </div>
          <h1 className="text-xl font-black text-foreground">InSuite Gate Pass Verification</h1>
          <p className="text-xs text-muted-foreground">
            Official institutional security credential & access pass verifier.
          </p>
        </div>

        {isLoading ? (
          <div className="rounded-3xl border border-border bg-card p-8 shadow-soft space-y-4 text-center">
            <div className="size-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-muted-foreground">Verifying gate pass credentials...</p>
          </div>
        ) : !pass ? (
          <div className="rounded-3xl border border-destructive/20 bg-card p-8 shadow-soft text-center space-y-3">
            <div className="size-12 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <XCircle className="size-6" />
            </div>
            <h2 className="text-base font-extrabold text-foreground">Invalid Pass</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No official gate pass matches number{" "}
              <strong className="text-foreground font-mono">{passNumber}</strong>. Access is unauthorized.
            </p>
          </div>
        ) : (
          <div
            className={`rounded-3xl border bg-card p-8 shadow-soft space-y-5 text-center ${
              pass.status === "Active" ? "border-emerald-500/30" : "border-border"
            }`}
          >
            <div
              className={`size-12 rounded-2xl flex items-center justify-center mx-auto ${
                pass.status === "Active"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {pass.status === "Active" ? <CheckCircle2 className="size-7" /> : <Clock className="size-7" />}
            </div>

            <div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                  pass.status === "Active"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : "bg-secondary text-muted-foreground border-border"
                }`}
              >
                Pass Status: {pass.status}
              </span>
              <h2 className="text-base font-black text-foreground mt-2">{pass.visitorName}</h2>
              <span className="text-[10px] text-muted-foreground font-bold">{pass.passType}</span>
            </div>

            {/* Safe Public Info */}
            <div className="bg-surface/50 p-4 rounded-2xl border border-border text-xs text-left space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pass Number:</span>
                <span className="font-bold text-primary">{pass.passNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Person To Meet:</span>
                <span className="font-bold text-foreground">{pass.personToMeetName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Purpose:</span>
                <span className="text-foreground">{pass.purpose}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Valid Until:</span>
                <span className="font-bold text-rose-600">
                  {new Date(pass.validUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>

            <p className="text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <Lock className="size-3" /> Zero Personal Identifiers Leaked
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
