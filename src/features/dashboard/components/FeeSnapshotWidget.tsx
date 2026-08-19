import React from "react";
import { Link } from "@tanstack/react-router";
import { Wallet, Settings, ArrowRight } from "lucide-react";
import type { FeeSnapshotData } from "../types";
import { Button } from "@/components/ui/button";

export const FeeSnapshotWidget: React.FC<{
  data: FeeSnapshotData | null;
  isLoading: boolean;
}> = ({ data }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Fee Snapshot</h2>
          <p className="text-xs text-muted-foreground">Tuition and institutional dues</p>
        </div>
      </div>

      {!data?.isConfigured ? (
        <div className="py-6 text-center space-y-3">
          <div className="mx-auto flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Wallet className="size-5" />
          </div>
          <p className="text-xs text-muted-foreground">
            Fee management is not configured yet. (Unlocks in Phase 9).
          </p>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/settings">
              <Settings className="size-3.5 mr-1 text-primary" /> Configure System
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="rounded-2xl bg-surface p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Expected</span>
            <p className="text-base font-black text-foreground">{data.totalExpected}</p>
          </div>
          <div className="rounded-2xl bg-emerald-500/10 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-emerald-600">Collected</span>
            <p className="text-base font-black text-emerald-600">{data.collected}</p>
          </div>
          <div className="rounded-2xl bg-surface p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-muted-foreground">Pending</span>
            <p className="text-base font-black text-foreground">{data.pending}</p>
          </div>
          <div className="rounded-2xl bg-rose-500/10 p-3 space-y-1">
            <span className="text-[10px] font-bold uppercase text-rose-500">Overdue</span>
            <p className="text-base font-black text-rose-500">{data.overdue}</p>
          </div>
        </div>
      )}
    </div>
  );
};
