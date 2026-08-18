import React from "react";
import { Activity, Clock, ShieldCheck, UserCheck, Calendar } from "lucide-react";
import type { ActivityItem } from "../types";

interface RecentActivityCardProps {
  activities: ActivityItem[];
}

export const RecentActivityCard: React.FC<RecentActivityCardProps> = ({ activities }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <Activity className="size-4 text-primary" />
          <h3 className="text-sm font-extrabold text-foreground">Recent Activity</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Audit Trail
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          Recent activity will appear here as administrative actions occur.
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-3 text-xs"
            >
              <div className="grid size-8 place-items-center rounded-xl bg-card border border-border text-primary shrink-0">
                <ShieldCheck className="size-4" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="font-bold text-foreground">{act.action}</p>
                <p className="text-[11px] text-muted-foreground">{act.description}</p>
                <div className="flex items-center gap-2 pt-1 text-[10px] text-muted-foreground/80">
                  <span>By {act.user}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-mono">
                    <Clock className="size-3" /> {act.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
