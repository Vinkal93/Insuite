import React from "react";
import { Layers, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StudentDistributionCard: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Student Distribution</h3>
          <p className="text-xs text-muted-foreground">Grade & section intake distribution</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          Phase 3
        </span>
      </div>

      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-secondary text-muted-foreground">
          <Layers className="size-6" />
        </div>
        <h4 className="mt-3 text-xs font-bold text-foreground">No classes configured yet</h4>
        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
          Add grades from Nursery to Grade 12 to visualize cohort distribution and section capacities.
        </p>
        <Button variant="outline" size="sm" disabled className="mt-4 rounded-xl text-xs opacity-60">
          Configure Classes
        </Button>
      </div>
    </div>
  );
};
