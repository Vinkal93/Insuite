import React from "react";
import { CalendarDays, Sparkles } from "lucide-react";

export const UpcomingEventsCard: React.FC = () => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <CalendarDays className="size-4 text-primary" />
          <h3 className="text-sm font-extrabold text-foreground">Upcoming Events & Schedule</h3>
        </div>
      </div>

      <div className="flex flex-col items-center justify-center py-6 text-center">
        <div className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
          <CalendarDays className="size-5" />
        </div>
        <p className="mt-3 text-xs font-semibold text-foreground">No upcoming events scheduled</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Exams, parent-teacher meetings, and academic holidays will appear here.
        </p>
      </div>
    </div>
  );
};
