import React, { useState, useEffect } from "react";
import { Clock, Calendar, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useTeacher } from "@/context/TeacherContext";
import { getTeacherTimetable } from "@/services/timetableService";
import type { TimetableEntry } from "@/types/timetable";
import { Button } from "@/components/ui/button";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const TeacherTimetableView: React.FC = () => {
  const { organization } = useAuth();
  const { teacher } = useTeacher();

  const [selectedDay, setSelectedDay] = useState("Monday");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimetable = async () => {
    if (!organization || !teacher) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await getTeacherTimetable(organization.id, teacher.id);
      setEntries(list);
    } catch (err: any) {
      console.error("loadTeacherTimetable error:", err);
      setError(err.message || "Failed to load timetable.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTimetable();
  }, [organization, teacher]);

  const dayEntries = entries
    .filter((e) => e.dayOfWeek === selectedDay)
    .sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Teaching Timetable
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Your personal weekly teaching schedule, period allocations, and classrooms.
        </p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {DAYS.map((day) => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              selectedDay === day
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {day}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadTimetable} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : dayEntries.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Clock className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No periods scheduled on {selectedDay}</h3>
          <p className="mt-1 text-xs text-muted-foreground">Select another day to review your schedule.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {dayEntries.map((p, i) => (
            <div
              key={p.id || i}
              className="p-4 rounded-2xl border border-border bg-card shadow-soft flex items-center justify-between gap-4 text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-primary/10 text-primary font-mono font-bold text-xs flex items-center justify-center shrink-0">
                  P{p.periodNumber || i + 1}
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">{p.subjectName}</h4>
                  <p className="text-[10px] text-muted-foreground">
                    Class {p.className} ({p.sectionName})
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-bold text-foreground">
                  {p.startTime} - {p.endTime}
                </span>
                <p className="text-[10px] text-muted-foreground font-semibold">
                  {p.roomNumber ? `Room ${p.roomNumber}` : "Main Classroom"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
