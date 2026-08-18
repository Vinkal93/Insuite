import React from "react";
import { CalendarCheck, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AttendanceOverviewCard: React.FC = () => {
  return (
    <div className="flex flex-col justify-between rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Today's Attendance Overview</h3>
          <p className="text-xs text-muted-foreground">Live daily attendance ratio & leaves</p>
        </div>
        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold text-muted-foreground">
          Phase 6
        </span>
      </div>

      {/* Breakdown Structure Preview */}
      <div className="grid grid-cols-4 gap-2 text-center text-xs">
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Present</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Absent</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Late</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-2.5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase">Leave</p>
          <p className="mt-1 font-bold text-muted-foreground/60">—</p>
        </div>
      </div>

      {/* Empty State Banner */}
      <div className="rounded-2xl border border-dashed border-border bg-surface/60 p-4 text-center">
        <p className="text-xs font-semibold text-foreground">Attendance data isn't available yet.</p>
        <p className="mt-0.5 text-[11px] text-muted-foreground">
          Attendance tracking and automatic parent notifications will activate in Phase 6.
        </p>
        <Button variant="outline" size="sm" disabled className="mt-3 rounded-xl text-xs opacity-60">
          Set Up Attendance
        </Button>
      </div>
    </div>
  );
};
