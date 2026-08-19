import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, ShieldCheck, SlidersHorizontal, Calendar, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import type { SetupProgressData } from "../types";

export const SchoolStatusStrip: React.FC<{ setupProgress: SetupProgressData | null }> = ({
  setupProgress,
}) => {
  const { selectedSession, organization } = useAuth();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    year: "numeric",
    weekday: "long",
  }).format(new Date());

  const percentage = setupProgress?.percentage ?? (organization?.setupCompleted ? 100 : 80);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-border bg-card px-6 py-3.5 shadow-soft">
      <div className="flex flex-wrap items-center gap-6 text-xs">
        {/* Academic Session */}
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-primary" />
          <span className="text-muted-foreground">Academic Session:</span>
          <strong className="font-bold text-foreground">
            {selectedSession?.name || "2026-27"} {selectedSession?.isActive ? "(Active)" : ""}
          </strong>
        </div>

        {/* School Status */}
        <div className="flex items-center gap-2">
          <div className="size-2 rounded-full bg-emerald-500" />
          <span className="text-muted-foreground">School Status:</span>
          <strong className="font-bold text-emerald-600 capitalize">
            {organization?.status || "Active"}
          </strong>
        </div>

        {/* Setup Completion */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="size-3.5 text-blue-500" />
          <span className="text-muted-foreground">Setup Completion:</span>
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <strong className="font-bold text-foreground">{percentage}% Complete</strong>
          </div>
        </div>

        {/* Today's Date */}
        <div className="hidden lg:flex items-center gap-2">
          <Calendar className="size-3.5 text-amber-500" />
          <span className="text-muted-foreground">Today's Date:</span>
          <strong className="font-bold text-foreground">{formattedDate}</strong>
        </div>
      </div>

      {percentage < 100 && (
        <Link
          to="/setup"
          className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
        >
          Complete Setup <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
};
