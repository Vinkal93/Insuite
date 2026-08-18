import React from "react";
import { Wallet, CreditCard, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const FeeOverviewCard: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Fee Collection Summary</h3>
          <p className="text-xs text-muted-foreground">Installment revenue & outstanding receivables</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          Phase 9
        </span>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center text-xs">
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Expected</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Collected</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Pending</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Overdue</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
      </div>

      {/* Empty State Notice */}
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-center">
        <p className="text-xs font-semibold text-foreground">Fee analytics will appear once fee management is configured.</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Online gateways, installment plans, and automatic receipts will connect in Phase 9.
        </p>
        <Button variant="outline" size="sm" disabled className="mt-3 rounded-xl text-xs opacity-60">
          Configure Fee Structures
        </Button>
      </div>
    </div>
  );
};
