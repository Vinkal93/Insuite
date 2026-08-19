import React from "react";
import { Link } from "@tanstack/react-router";
import { Plus, CheckSquare, Calendar, ChevronDown, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const DashboardHeader: React.FC = () => {
  const { userProfile, organization, allSessions, selectedSession, setSelectedSession } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const userName = userProfile?.displayName || userProfile?.email?.split("@")[0] || "Administrator";

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {getGreeting()}, {userName} 👋
          </h1>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Here's what's happening at {organization?.name || "your school"} today.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Session Selector */}
        {allSessions.length > 0 && (
          <div className="relative">
            <select
              value={selectedSession?.id || ""}
              onChange={(e) => {
                const found = allSessions.find((s) => s.id === e.target.value);
                if (found) setSelectedSession(found);
              }}
              className="appearance-none rounded-xl border border-border bg-card py-2 pl-3 pr-8 text-xs font-bold text-foreground shadow-xs focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {allSessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isActive ? "(Current Session)" : ""}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          </div>
        )}

        {/* Quick Top Actions */}
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/students/new">
            <Plus className="size-3.5 mr-1" /> Add Student
          </Link>
        </Button>

        <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
          <Link to="/attendance/students/take">
            <CheckSquare className="size-3.5 mr-1 text-emerald-600" /> Take Attendance
          </Link>
        </Button>
      </div>
    </div>
  );
};
