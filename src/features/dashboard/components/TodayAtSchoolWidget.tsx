import React from "react";
import { Link } from "@tanstack/react-router";
import { CheckSquare, Users, GraduationCap, Clock, Calendar, ArrowRight } from "lucide-react";
import type { TodayAtSchoolData } from "../types";
import { Button } from "@/components/ui/button";

export const TodayAtSchoolWidget: React.FC<{
  data: TodayAtSchoolData | null;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Today at School</h2>
          <p className="text-xs text-muted-foreground">Live daily campus operations & attendance</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
          <Link to="/attendance">
            View All <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Student Attendance Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Users className="size-3.5 text-blue-500" /> Students
            </span>
            <span className="text-emerald-600">{data?.studentsPresent ?? 0} Present</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>Absent: <strong className="text-rose-500 font-bold">{data?.studentsAbsent ?? 0}</strong></span>
            <span>Unmarked: <strong className="text-amber-500 font-bold">{data?.studentsNotMarked ?? 0}</strong></span>
          </div>
        </div>

        {/* Teacher Attendance Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <GraduationCap className="size-3.5 text-purple-500" /> Teaching Faculty
            </span>
            <span className="text-emerald-600">{data?.teachersPresent ?? 0} Present</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>On Duty: <strong className="font-bold text-foreground">{data?.teachersPresent ?? 0}</strong></span>
            <span>Absent / Leave: <strong className="text-rose-500 font-bold">{data?.teachersAbsent ?? 0}</strong></span>
          </div>
        </div>

        {/* Class Timetable Summary */}
        <div className="rounded-2xl border border-border bg-surface p-4 space-y-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-bold text-foreground">
            <span className="flex items-center gap-1.5">
              <Clock className="size-3.5 text-teal-500" /> Today's Periods
            </span>
            <span className="text-teal-600">{data?.classesScheduled ?? 0} Total</span>
          </div>
          <div className="flex justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/60">
            <span>In Progress: <strong className="font-bold text-foreground">{data?.classesScheduled ?? 0} classes</strong></span>
          </div>
        </div>
      </div>

      {!data?.hasAttendance && (
        <div className="flex items-center justify-between rounded-2xl bg-amber-500/10 p-3.5 text-xs text-amber-800 dark:text-amber-300">
          <span>Student attendance has not been recorded yet today.</span>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/attendance/students/take">Take Attendance</Link>
          </Button>
        </div>
      )}
    </div>
  );
};
