import React from "react";
import { UserCheck, Sparkles, ArrowRight, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AdmissionOverviewCard: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Admission Overview</h3>
          <p className="text-xs text-muted-foreground">Inquiries, counseling & verified intake</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          Phase 4
        </span>
      </div>

      {/* Professional Empty State */}
      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="grid size-12 place-items-center rounded-2xl bg-secondary/80 text-muted-foreground">
          <UserCheck className="size-6" />
        </div>
        <h4 className="mt-3 text-xs font-bold text-foreground">Admission analytics will appear here</h4>
        <p className="mt-1 max-w-xs text-[11px] leading-relaxed text-muted-foreground">
          Manage inquiries, lead sources, and admission verification once the Admissions module is configured.
        </p>
        <span className="mt-4 rounded-xl border border-border bg-secondary/50 px-3 py-1 text-[10px] font-semibold text-muted-foreground">
          Coming Soon in Phase 4
        </span>
      </div>
    </div>
  );
};
