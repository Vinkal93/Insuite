import React from "react";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import type { UpcomingEventItem } from "../types";

export const UpcomingEventsWidget: React.FC<{
  events?: UpcomingEventItem[];
  isLoading?: boolean;
}> = ({ events = [] }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Upcoming</h2>
          <p className="text-xs text-muted-foreground">Academic milestones & events</p>
        </div>
      </div>

      {events.length === 0 ? (
        <div className="py-6 text-center text-xs text-muted-foreground">
          <Calendar className="mx-auto size-6 opacity-40 mb-1" />
          <p>No upcoming events scheduled.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((ev) => (
            <div key={ev.id} className="flex items-center gap-3 text-xs">
              <div className="flex flex-col items-center rounded-xl bg-primary/10 px-2.5 py-1 text-center text-primary shrink-0">
                <span className="text-[10px] font-bold uppercase">{ev.month}</span>
                <span className="text-sm font-black">{ev.day}</span>
              </div>
              <div className="space-y-0.5 truncate">
                <p className="font-bold text-foreground truncate">{ev.title}</p>
                <p className="text-[10px] text-muted-foreground">{ev.time}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
