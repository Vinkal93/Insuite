import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Ticket, Search, Eye, AlertCircle, RefreshCw, Printer } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listGatePasses } from "@/services/frontOfficeService";
import type { FrontOfficeGatePass } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const GatePassesListView: React.FC = () => {
  const { organization } = useAuth();
  const [passes, setPasses] = useState<FrontOfficeGatePass[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPasses = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listGatePasses(organization.id, {
        status: statusFilter || undefined,
        search: search || undefined,
      });
      setPasses(list);
    } catch (err: any) {
      console.error("loadGatePasses error:", err);
      setError(err.message || "Failed to load gate passes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPasses();
  }, [organization, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Gate Passes & Campus Access
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Security gate passes issued for authorized visitors, vendors, and parents.
          </p>
        </div>

        <Link
          to="/front-office/visitors/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Ticket className="size-4" /> Issue Gate Pass
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
            placeholder="Search by pass number, visitor name, or person to meet..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="Active">Active Passes</option>
          <option value="Used">Used / Checked Out</option>
          <option value="Expired">Expired</option>
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
          <Button onClick={loadPasses} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : passes.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Ticket className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No gate passes recorded</h3>
          <p className="mt-1 text-xs text-muted-foreground">Issued gate passes will be catalogued here.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Pass Number</th>
                  <th className="py-3 px-4">Visitor</th>
                  <th className="py-3 px-4">Person To Meet</th>
                  <th className="py-3 px-4">Purpose</th>
                  <th className="py-3 px-4">Valid From</th>
                  <th className="py-3 px-4">Valid Until</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {passes.map((p) => (
                  <tr key={p.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {p.passNumber}
                    </td>
                    <td className="py-3 px-4 font-bold text-foreground">{p.visitorName}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">{p.personToMeetName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{p.purpose}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(p.validFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {new Date(p.validUntil).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                          p.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-secondary text-muted-foreground border-border"
                        }`}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        to={`/front-office/gate-passes/${p.id}`}
                        className="font-bold text-primary hover:underline text-[11px] flex items-center justify-end gap-1"
                      >
                        <Eye className="size-3" /> View / Print
                      </Link>
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
