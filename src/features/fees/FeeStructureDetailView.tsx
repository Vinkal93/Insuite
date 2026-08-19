import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Layers,
  Calendar,
  FileText,
  CreditCard,
  Plus,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { FeeStructure, FeeInvoice } from "@/types/fees";
import {
  getFeeStructure,
  generateInvoicesForClass,
  listFeeInvoices,
} from "@/services/feeService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const FeeStructureDetailView: React.FC = () => {
  const { structureId } = useParams({ from: "/fees/structure/$structureId" });
  const { organization, firebaseUser } = useAuth();
  const [structure, setStructure] = useState<FeeStructure | null>(null);
  const [invoices, setInvoices] = useState<FeeInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 15 * 86400000).toISOString().split("T")[0]
  );
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = async () => {
    if (!organization || !structureId) return;
    setIsLoading(true);
    try {
      const [st, invs] = await Promise.all([
        getFeeStructure(organization.id, structureId),
        listFeeInvoices(organization.id),
      ]);
      setStructure(st);
      setInvoices(invs.filter((i) => i.feeStructureId === structureId));
    } catch (err) {
      console.error("FeeStructureDetailView load error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, structureId]);

  const handleGenerateInvoices = async () => {
    if (!organization || !firebaseUser || !structure) return;
    setIsGenerating(true);
    setStatusMsg(null);
    try {
      const result = await generateInvoicesForClass(
        organization.id,
        structure.id,
        dueDate,
        {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || "Admin",
        }
      );
      setStatusMsg({
        type: "success",
        text: `Generated ${result.createdCount} student fee invoices successfully.`,
      });
      loadData();
    } catch (err: any) {
      setStatusMsg({
        type: "error",
        text: err.message || "Failed to generate class invoices.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 pb-16">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-secondary" />
        <div className="h-48 animate-pulse rounded-3xl bg-secondary/80" />
      </div>
    );
  }

  if (!structure) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center space-y-3">
        <AlertCircle className="mx-auto size-8 text-rose-500" />
        <h3 className="text-sm font-bold text-foreground">Fee structure not found</h3>
        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/fees/structure">Back to Structures</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="rounded-xl size-9">
            <Link to="/fees/structure">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
                {structure.name}
              </h1>
              <span
                className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                  structure.status === "ACTIVE"
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {structure.status}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Class: <strong className="text-foreground">{structure.className || "Class"}</strong> • Frequency: {structure.frequency}
            </p>
          </div>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`flex items-center gap-2.5 rounded-2xl border p-4 text-xs ${
            statusMsg.type === "success"
              ? "border-success/20 bg-success/10 text-success"
              : "border-destructive/20 bg-destructive/10 text-destructive"
          }`}
        >
          {statusMsg.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Overview Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
          Fee Components Itemization
        </h2>

        <div className="divide-y divide-border">
          {structure.components.map((comp, idx) => (
            <div key={idx} className="flex items-center justify-between py-3 text-xs">
              <div>
                <p className="font-bold text-foreground">{comp.name}</p>
                <p className="text-[11px] text-muted-foreground">{comp.description || comp.frequency}</p>
              </div>
              <p className="font-mono font-bold text-foreground">₹{Number(comp.amount).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-2xl bg-secondary/60 p-4 border border-border">
          <span className="text-xs font-bold text-foreground uppercase tracking-wider">Total Amount</span>
          <span className="font-mono text-xl font-black text-primary">₹{structure.totalAmount.toLocaleString()}</span>
        </div>
      </div>

      {/* Bill Class Section */}
      <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-soft sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="size-4 text-primary" />
          <h2 className="text-sm font-extrabold text-foreground">Generate Invoices for {structure.className}</h2>
        </div>
        <p className="text-xs text-muted-foreground">
          Automatically creates individual student fee invoices for all currently active students in {structure.className}.
        </p>

        <div className="flex flex-col sm:flex-row items-end gap-3 pt-2">
          <div className="space-y-1.5 flex-1 w-full">
            <Label className="text-xs font-semibold">Invoice Due Date *</Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-xl text-xs font-semibold"
            />
          </div>

          <Button
            onClick={handleGenerateInvoices}
            disabled={isGenerating || structure.status !== "ACTIVE"}
            variant="hero"
            size="sm"
            className="rounded-xl text-xs font-bold shadow-soft shrink-0"
          >
            {isGenerating ? <Loader2 className="size-4 animate-spin mr-1.5" /> : <FileText className="size-3.5 mr-1.5" />}
            Generate Class Invoices
          </Button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-foreground">Generated Invoices ({invoices.length})</h3>
          <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/fees/students">View Student Ledgers</Link>
          </Button>
        </div>

        {invoices.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground italic">No student invoices generated for this structure yet.</p>
        ) : (
          <div className="divide-y divide-border text-xs">
            {invoices.slice(0, 10).map((inv) => (
              <div key={inv.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-bold text-foreground">{inv.studentName}</p>
                  <p className="text-[11px] text-muted-foreground">Inv: {inv.invoiceNumber} • Due: {inv.dueDate}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-foreground">₹{inv.totalAmount.toLocaleString()}</p>
                  <span
                    className={`inline-block rounded-md px-1.5 py-0.5 text-[9px] font-bold ${
                      inv.status === "PAID"
                        ? "bg-emerald-500/10 text-emerald-600"
                        : "bg-amber-500/10 text-amber-600"
                    }`}
                  >
                    {inv.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
