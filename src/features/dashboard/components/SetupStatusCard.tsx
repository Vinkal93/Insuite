import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight, SlidersHorizontal, Sparkles } from "lucide-react";
import type { SetupProgressData } from "../types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

interface SetupStatusCardProps {
  setupProgress: SetupProgressData | null;
  isLoading: boolean;
}

export const SetupStatusCard: React.FC<SetupStatusCardProps> = ({ setupProgress, isLoading }) => {
  if (isLoading || !setupProgress) {
    return (
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="h-5 w-40 bg-secondary rounded animate-pulse" />
        <div className="h-3 w-full bg-secondary rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold tracking-tight">School Setup Status</h2>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary">
              {setupProgress.percentage}% Complete
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Complete all foundational milestones to unlock complete academic automation.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl font-bold">
          <Link to="/setup">
            <SlidersHorizontal className="size-3.5 mr-1.5" /> Continue Setup <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Progress Bar */}
      <Progress value={setupProgress.percentage} className="h-2 rounded-full" />

      {/* Checklist items */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 pt-1">
        {setupProgress.items.map((item) => (
          <div
            key={item.key}
            className={`flex items-center gap-2 rounded-xl border p-2 text-xs transition-all ${
              item.isCompleted
                ? "border-success/30 bg-success/5 text-success font-semibold"
                : "border-border bg-surface text-muted-foreground opacity-60"
            }`}
          >
            {item.isCompleted ? (
              <CheckCircle2 className="size-3.5 shrink-0 text-success" />
            ) : (
              <Circle className="size-3.5 shrink-0 text-muted-foreground" />
            )}
            <span className="truncate text-[11px]">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
