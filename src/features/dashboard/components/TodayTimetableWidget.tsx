import React from "react";
import { Link } from "@tanstack/react-router";
import { Clock, ArrowRight, Plus } from "lucide-react";
import type { TodayTimetableItem } from "../types";
import { Button } from "@/components/ui/button";

export const TodayTimetableWidget: React.FC<{
  timetable: TodayTimetableItem[];
  isLoading: boolean;
}> = ({ timetable, isLoading }) => {
  return (
    <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Today's Timetable</h2>
          <p className="text-xs text-muted-foreground">Classroom schedule and active bell timings</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
          <Link to="/timetable/classes">
            View Schedule <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </div>

      {timetable.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground space-y-3">
          <Clock className="mx-auto size-7 opacity-40" />
          <p className="text-xs font-semibold">No classes scheduled for today.</p>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/timetable/create">
              <Plus className="size-3.5 mr-1" /> Create Timetable
            </Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
              <tr>
                <th className="px-6 py-3 font-bold">Time Window</th>
                <th className="px-4 py-3 font-bold">Class & Section</th>
                <th className="px-4 py-3 font-bold">Subject</th>
                <th className="px-4 py-3 font-bold">Assigned Teacher</th>
                <th className="px-6 py-3 font-bold text-right">Room / Lab</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {timetable.map((item) => (
                <tr key={item.id} className="hover:bg-secondary/40 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-bold text-foreground">
                    {item.time}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-foreground">
                    {item.className} ({item.sectionName})
                  </td>
                  <td className="px-4 py-3.5 font-medium text-foreground">
                    {item.subjectName}
                  </td>
                  <td className="px-4 py-3.5 text-muted-foreground">
                    {item.teacherName}
                  </td>
                  <td className="px-6 py-3.5 text-right font-semibold text-foreground">
                    {item.roomName}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
