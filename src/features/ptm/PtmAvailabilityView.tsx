import React, { useState, useEffect } from "react";
import { Users, Calendar, AlertCircle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listPtmEvents } from "@/services/ptmService";
import { getTeachers } from "@/services/academicService";
import type { PtmEvent } from "@/types/ptm";
import type { Teacher } from "@/types/academic";
import { Button } from "@/components/ui/button";

export const PtmAvailabilityView: React.FC = () => {
  const { organization } = useAuth();
  const [events, setEvents] = useState<PtmEvent[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [evList, tList] = await Promise.all([
        listPtmEvents(organization.id),
        getTeachers(organization.id),
      ]);
      setEvents(evList);
      setTeachers(tList);
      if (evList.length > 0 && !selectedEventId) {
        setSelectedEventId(evList[0].id);
      }
    } catch (err: any) {
      console.error("loadAvailability error:", err);
      setError(err.message || "Failed to load faculty availability.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Faculty PTM Availability
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review and manage teacher participation across scheduled parent-teacher conferences.
        </p>
      </div>

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
              {e.name}
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : teachers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No faculty members on record</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add teachers in Academics/Staff module.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Teacher Name</th>
                  <th className="py-3 px-4">Employee ID</th>
                  <th className="py-3 px-4">Department</th>
                  <th className="py-3 px-4">Availability Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">
                        {t.firstName} {t.lastName}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">{t.email}</span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-primary">{t.employeeId}</td>
                    <td className="py-3 px-4 text-muted-foreground">{t.department || "Academics"}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        <CheckCircle2 className="size-3" /> Available for Conference
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
