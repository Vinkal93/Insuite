import React from "react";
import { Link } from "@tanstack/react-router";
import { History, ArrowRight, User } from "lucide-react";
import type { ActivityItem } from "../types";
import { Button } from "@/components/ui/button";

export const RecentActivityWidget: React.FC<{
  activities: ActivityItem[];
  isLoading: boolean;
}> = ({ activities, isLoading }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Recent Activity</h2>
          <p className="text-xs text-muted-foreground">Audit trail and system event stream</p>
        </div>
      </div>

      {activities.length === 0 ? (
        <p className="py-6 text-center text-xs text-muted-foreground italic">
          No recent activity logs recorded yet.
        </p>
      ) : (
        <div className="space-y-3 pt-1">
          {activities.map((act) => (
            <div
              key={act.id}
              className="flex items-start gap-3 rounded-xl p-2 hover:bg-secondary/30 transition-colors text-xs"
            >
              <div className="size-2 rounded-full bg-primary mt-1.5 shrink-0" />
              <div className="flex-1 space-y-0.5">
                <p className="font-bold text-foreground">{act.action}</p>
                <p className="text-[11px] text-muted-foreground line-clamp-1">{act.description}</p>
              </div>
              <div className="text-right text-[10px] text-muted-foreground shrink-0">
                <p className="font-semibold text-foreground">{act.user}</p>
                <p>{new Date(act.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
