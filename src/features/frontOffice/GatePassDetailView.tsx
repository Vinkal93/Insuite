import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Ticket,
  Printer,
  ArrowLeft,
  QrCode,
  ShieldCheck,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getGatePass } from "@/services/frontOfficeService";
import type { FrontOfficeGatePass } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const GatePassDetailView: React.FC = () => {
  const { id } = useParams({ strict: false }) as { id: string };
  const { organization } = useAuth();

  const [pass, setPass] = useState<FrontOfficeGatePass | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPass = async () => {
    if (!organization || !id) return;
    setIsLoading(true);
    setError(null);
    try {
      const p = await getGatePass(organization.id, id);
      setPass(p);
    } catch (err: any) {
      console.error("loadGatePassDetail error:", err);
      setError(err.message || "Failed to load gate pass.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPass();
  }, [organization, id]);

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !pass) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error || "Gate pass not found."}</p>
        <Link
          to="/front-office/gate-passes"
          className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-card border border-border text-xs font-bold text-foreground"
        >
          <ArrowLeft className="size-3.5" /> Return to Passes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Controls Bar (Hidden in Print) */}
      <div className="print:hidden flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/front-office/gate-passes"
            className="p-2 rounded-2xl bg-card border border-border hover:border-primary text-foreground transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <div>
            <h1 className="text-xl font-black text-foreground">Visitor Gate Pass</h1>
            <p className="text-xs text-muted-foreground font-mono">Pass #{pass.passNumber}</p>
          </div>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={handlePrint}
          className="rounded-xl text-xs font-bold"
        >
          <Printer className="size-3.5 mr-1.5" /> Print Pass Slip
        </Button>
      </div>

      {/* Official Gate Pass Card / Thermal Slip */}
      <div className="bg-card text-foreground border-2 border-dashed border-border rounded-3xl p-6 sm:p-8 shadow-soft space-y-5 print:border-black print:shadow-none print:m-0 print:p-6 font-mono text-xs">
        {/* Header */}
        <div className="text-center space-y-1 border-b border-border pb-4 font-sans">
          <div className="size-10 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center mx-auto">
            {organization?.name?.charAt(0) || "S"}
          </div>
          <h2 className="text-base font-black text-foreground uppercase tracking-wide">
            {organization?.name || "School Campus"}
          </h2>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest text-primary">
            Official Visitor Gate Pass
          </p>
        </div>

        {/* Pass Info Grid */}
        <div className="space-y-2.5 py-1">
          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Pass Number:</span>
            <span className="font-bold text-primary">{pass.passNumber}</span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Visitor Name:</span>
            <span className="font-bold text-foreground">{pass.visitorName}</span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Visitor Category:</span>
            <span className="text-foreground">{pass.passType}</span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Person To Meet:</span>
            <span className="font-bold text-foreground">{pass.personToMeetName}</span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Purpose of Visit:</span>
            <span className="text-foreground">{pass.purpose}</span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Issued At:</span>
            <span>{new Date(pass.validFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>

          <div className="flex justify-between border-b border-border/50 pb-1">
            <span className="text-muted-foreground">Valid Until:</span>
            <span className="font-bold text-rose-600">
              {new Date(pass.validUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        </div>

        {/* QR & Signature Footer */}
        <div className="pt-4 border-t border-border flex items-center justify-between font-sans">
          <div className="space-y-1">
            <div className="size-16 border border-border rounded-xl bg-surface/80 flex items-center justify-center p-1">
              <QrCode className="size-12 text-foreground" />
            </div>
            <span className="text-[8px] font-mono text-muted-foreground block">
              Scan to Verify
            </span>
          </div>

          <div className="text-right space-y-1">
            <div className="h-6 border-b border-foreground/30 w-28 ml-auto" />
            <span className="text-[10px] font-bold text-foreground block">
              {pass.createdBy || "Gate Security"}
            </span>
            <span className="text-[9px] text-muted-foreground">Authorized Check-In</span>
          </div>
        </div>
      </div>
    </div>
  );
};
