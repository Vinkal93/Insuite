import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Plus,
  Clock,
  Video,
  MapPin,
  ArrowRight,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listPtmEvents } from "@/services/ptmService";
import type { PtmEvent } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmEventsListView: React.FC = () => {
  const { organization } = useAuth();
  const [events, setEvents] = useState<PtmEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listPtmEvents(organization.id);
      setEvents(list);
    } catch (err: any) {
      console.error("loadPtmEvents error:", err);
      setError(err.message || "Failed to load PTM events.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            PTM Events Schedule
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure term parent-teacher meeting events, slot durations, and participation rosters.
          </p>
        </div>

        <Link
          to="/ptm/events/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Create PTM Event
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadEvents} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Calendar className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No PTM events scheduled</h3>
          <p className="mt-1 text-xs text-muted-foreground">Click "Create PTM Event" to schedule meetings.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => (
            <div
              key={e.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 flex flex-col justify-between hover:border-primary/40 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                    {e.mode}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      e.status === "OPEN"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : e.status === "DRAFT"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {e.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-base text-foreground">{e.name}</h3>
                  {e.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{e.description}</p>
                  )}
                </div>

                <div className="bg-surface/50 p-3 rounded-2xl border border-border space-y-1 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-bold text-foreground">{e.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Timing:</span>
                    <span className="font-bold text-primary">
                      {e.startTime} - {e.endTime}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Slot Duration:</span>
                    <span className="text-foreground">{e.slotDuration} Mins</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-border flex items-center justify-between">
                <Link
                  to={`/ptm/events/${e.id}`}
                  className="font-bold text-primary hover:underline flex items-center gap-1 text-[11px]"
                >
                  Manage Slots & Appts <ArrowRight className="size-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
