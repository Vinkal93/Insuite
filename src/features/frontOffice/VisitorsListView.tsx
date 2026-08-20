import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Plus,
  Search,
  Filter,
  LogOut,
  Ticket,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listVisits, checkOutVisitor } from "@/services/frontOfficeService";
import type { FrontOfficeVisit } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const VisitorsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
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
      setVisits(list);
    } catch (err: any) {
      console.error("loadVisits error:", err);
      setError(err.message || "Failed to load visitors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, [organization, statusFilter, search]);

  const handleCheckOut = async (visitId: string, visitorName: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Confirm check-out for ${visitorName}?`)) return;

    try {
      await checkOutVisitor(organization.id, visitId, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Receptionist",
      });
      alert(`${visitorName} checked out successfully.`);
      await loadVisits();
    } catch (err: any) {
      alert("Check-out failed: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Visitor Management Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Log, track, and manage visitors, parent meetings, deliveries, and gate check-outs.
          </p>
        </div>

        <Link
          to="/front-office/visitors/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Check In Visitor
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by visitor name, mobile, person to meet, or gate pass number..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Inside">Currently Inside</option>
          <option value="Exited">Exited / Checked Out</option>
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
          <h3 className="mt-3 text-sm font-bold text-foreground">No visitors recorded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Check in a visitor to begin logging.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Person To Meet</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Entry Time</th>
                  <th className="py-3 px-4">Exit Time</th>
                  <th className="py-3 px-4">Gate Pass</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
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

                    <td className="py-3 px-4 text-foreground font-semibold">
                      {v.personToMeetName}
                    </td>

                    <td className="py-3 px-4 text-muted-foreground">{v.purpose}</td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(v.entryTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>

                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {v.exitTime
                        ? new Date(v.exitTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </td>

                    <td className="py-3 px-4">
                      {v.gatePassNumber ? (
                        <Link
                          to={`/front-office/gate-passes/${v.gatePassId || ""}`}
                          className="font-mono font-bold text-primary hover:underline text-[11px]"
                        >
                          {v.gatePassNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          v.status === "Inside"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {v.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {v.status === "Inside" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckOut(v.id, v.visitorName)}
                          className="rounded-xl text-[11px] font-bold h-7 px-2.5 text-rose-600 hover:bg-rose-50"
                        >
                          <LogOut className="size-3 mr-1" /> Check Out
                        </Button>
                      )}
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
