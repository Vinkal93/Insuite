import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  PhoneCall,
  Plus,
  PhoneIncoming,
  PhoneOutgoing,
  Search,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listFrontOfficeCalls } from "@/services/frontOfficeService";
import type { FrontOfficeCall } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const CallLogsListView: React.FC = () => {
  const { organization } = useAuth();
  const [calls, setCalls] = useState<FrontOfficeCall[]>([]);
  const [directionFilter, setDirectionFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCalls = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listFrontOfficeCalls(organization.id);
      const filtered = directionFilter
        ? list.filter((c) => c.direction === directionFilter)
        : list;
      setCalls(filtered);
    } catch (err: any) {
      console.error("loadCalls error:", err);
      setError(err.message || "Failed to load call logs.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCalls();
  }, [organization, directionFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Phone Call Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log incoming and outgoing reception phone calls, parent inquiries, and follow-ups.
          </p>
        </div>

        <Link
          to="/front-office/calls/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Log Phone Call
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Incoming", "Outgoing"].map((dir) => (
          <button
            key={dir}
            onClick={() => setDirectionFilter(dir)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              directionFilter === dir
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {dir ? `${dir} Calls` : "All Calls"}
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
          <Button onClick={loadCalls} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : calls.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <PhoneCall className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No call logs found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Logged telephonic communications will appear here.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Direction</th>
                  <th className="py-3 px-4">Caller / Recipient</th>
                  <th className="py-3 px-4">Mobile</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Follow-up Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {calls.map((c) => (
                  <tr key={c.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(c.createdAt).toLocaleDateString()} •{" "}
                      {new Date(c.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        {c.direction === "Incoming" ? (
                          <PhoneIncoming className="size-3.5 text-emerald-600" />
                        ) : (
                          <PhoneOutgoing className="size-3.5 text-blue-600" />
                        )}
                        <span className="font-bold text-foreground">{c.direction}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-foreground">{c.callerName}</td>
                    <td className="py-3 px-4 font-mono text-primary font-bold">{c.mobile}</td>
                    <td className="py-3 px-4 text-muted-foreground">{c.purpose}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{c.followUpDate || "—"}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-foreground border border-border">
                        {c.status}
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
