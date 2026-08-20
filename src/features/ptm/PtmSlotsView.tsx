import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Clock, Calendar, Users, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listPtmEvents, listPtmSlots } from "@/services/ptmService";
import type { PtmEvent, PtmSlot } from "@/types/ptm";
import { Button } from "@/components/ui/button";

export const PtmSlotsView: React.FC = () => {
  const { organization } = useAuth();
  const [events, setEvents] = useState<PtmEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [slots, setSlots] = useState<PtmSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadEventsAndSlots = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const evList = await listPtmEvents(organization.id);
      setEvents(evList);

      const targetId = selectedEventId || (evList.length > 0 ? evList[0].id : "");
      setSelectedEventId(targetId);

      if (targetId) {
        const slList = await listPtmSlots(organization.id, targetId);
        setSlots(slList);
      }
    } catch (err: any) {
      console.error("loadPtmSlots error:", err);
      setError(err.message || "Failed to load slots.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadEventsAndSlots();
  }, [organization, selectedEventId]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Time Slots Grid
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Atomic conference time intervals generated across faculty members.
        </p>
      </div>

      {/* Event Selector */}
      {events.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {events.map((e) => (
            <button
              key={e.id}
              onClick={() => setSelectedEventId(e.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                selectedEventId === e.id
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {e.name} ({e.date})
            </button>
          ))}
        </div>
      )}

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
          <Button onClick={loadEventsAndSlots} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Clock className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No time slots for this event</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Open the event details page and click "Generate Slots" to populate intervals.
          </p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {slots.map((s) => (
            <div
              key={s.id}
              className="p-4 rounded-2xl border border-border bg-card shadow-soft space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-foreground">
                  {s.startTime} - {s.endTime}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    s.status === "AVAILABLE"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  }`}
                >
                  {s.status}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold truncate">
                {s.teacherName}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
