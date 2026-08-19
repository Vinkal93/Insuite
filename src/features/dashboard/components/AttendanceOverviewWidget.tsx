import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckSquare } from "lucide-react";
import type { AttendanceOverviewData } from "../types";
import { Button } from "@/components/ui/button";

export const AttendanceOverviewWidget: React.FC<{
  data: AttendanceOverviewData | null;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  const percentage = data?.percentage || 0;
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-foreground">Attendance Overview</h2>
        <span className="text-[11px] font-bold text-muted-foreground uppercase">Today</span>
      </div>

      {!data?.hasData ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-xs text-muted-foreground">No attendance recorded today.</p>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/attendance/students/take">
              <CheckSquare className="size-3.5 mr-1 text-primary" /> Take Attendance
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center justify-around gap-6 pt-2">
          {/* Circular Progress Ring */}
          <div className="relative flex size-28 items-center justify-center">
            <svg className="size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-secondary"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-emerald-500 transition-all duration-1000 ease-out"
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
              />
            </svg>
            <div className="absolute text-center">
              <span className="text-lg font-black text-foreground">{percentage}%</span>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                Present
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-emerald-500" />
              <span className="text-muted-foreground">Present:</span>
              <strong className="font-bold text-foreground">{data.present}</strong>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-rose-500" />
              <span className="text-muted-foreground">Absent:</span>
              <strong className="font-bold text-foreground">{data.absent}</strong>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-amber-500" />
              <span className="text-muted-foreground">Late:</span>
              <strong className="font-bold text-foreground">{data.late}</strong>
            </div>
            <div className="flex items-center gap-2">
              <div className="size-2.5 rounded-full bg-blue-500" />
              <span className="text-muted-foreground">Leave:</span>
              <strong className="font-bold text-foreground">{data.leave}</strong>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
