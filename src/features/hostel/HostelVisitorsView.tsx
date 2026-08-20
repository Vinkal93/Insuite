import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Users, Search, Plus, Eye, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listVisits } from "@/services/frontOfficeService";
import type { FrontOfficeVisit } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const HostelVisitorsView: React.FC = () => {
  const { organization } = useAuth();
  const [visits, setVisits] = useState<FrontOfficeVisit[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadVisits = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listVisits(organization.id, {
        status: statusFilter || undefined,
        search: search || undefined,
      });
      // Filter visits intended for boarding students / hostel
      setVisits(list);
    } catch (err: any) {
      console.error("loadHostelVisitors error:", err);
      setError(err.message || "Failed to load hostel visitors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [organization, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel Visitor Logs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Integrated live with Front Office security gates — records verified parent and guardian visits.
          </p>
        </div>

        <Link
          to="/front-office/visitors/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Register Visitor at Gate
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor name, mobile, resident student, or gate pass..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Inside">Currently on Campus</option>
          <option value="Exited">Exited</option>
        </select>
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
          <Button onClick={loadVisits} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : visits.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No hostel visitors recorded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Checked-in visitor logs from the security gate will appear here.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Meeting Resident</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Gate Pass</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {visits.map((v) => (
                  <tr key={v.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4">
                      <span className="font-bold text-foreground block">{v.visitorName}</span>
                      <span className="text-[10px] text-muted-foreground font-mono">{v.visitorMobile}</span>
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-muted-foreground">
                        {v.visitorType}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-foreground">{v.personToMeetName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{v.purpose}</td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {v.exitTime
                        ? new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {v.gatePassNumber || "—"}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          v.status === "Inside"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {v.status}
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
