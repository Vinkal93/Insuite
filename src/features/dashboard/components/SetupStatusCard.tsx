import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Circle, ArrowRight, Sparkles, SlidersHorizontal } from "lucide-react";
import type { SetupProgressData } from "../types";
import { Button } from "@/components/ui/button";

export const SetupStatusCard: React.FC<{
  setupProgress: SetupProgressData | null;
  isLoading: boolean;
}> = ({ setupProgress, isLoading }) => {
  if (!setupProgress || setupProgress.isComplete || setupProgress.percentage >= 100) {
    return null;
  }

  return (
    <div className="rounded-3xl border border-primary/20 bg-primary/5 p-6 shadow-soft space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <div className="rounded-xl bg-primary p-2 text-primary-foreground">
            <Sparkles className="size-4" />
          </div>
          <div>
            <h2 className="text-sm font-extrabold text-foreground">
              Complete Your School Setup ({setupProgress.percentage}%)
            </h2>
            <p className="text-xs text-muted-foreground">
              Finish configuring class sections, subjects, and teachers to unlock full ERP automation.
            </p>
          </div>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shrink-0">
          <Link to="/setup">
            Continue Setup <ArrowRight className="size-3.5 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 pt-1">
        {setupProgress.items.map((item) => (
          <Link
            key={item.key}
            to={item.route || "/setup"}
            className="flex items-center gap-2 rounded-xl bg-card border border-border/80 px-3 py-2 text-xs hover:border-primary transition-colors"
          >
            {item.isCompleted ? (
              <CheckCircle2 className="size-3.5 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="size-3.5 text-muted-foreground shrink-0" />
            )}
            <span
              className={`font-semibold truncate ${
                item.isCompleted ? "text-foreground" : "text-muted-foreground"
              }`}
            >
              {item.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};
