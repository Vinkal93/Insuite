import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  UserCheck,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Bus,
  ShieldAlert,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listDrivers,
  calculateDocumentStatus,
  getTransportSettings,
} from "@/services/transportService";
import type { TransportDriver, TransportSettingsConfig } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const DriversListView: React.FC = () => {
  const { organization } = useAuth();
  const [drivers, setDrivers] = useState<TransportDriver[]>([]);
  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadDrivers = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [dList, conf] = await Promise.all([
        listDrivers(organization.id),
        getTransportSettings(organization.id),
      ]);
      setDrivers(dList);
      setSettings(conf);
    } catch (err: any) {
      console.error("loadDrivers error:", err);
      setError(err.message || "Failed to load driver roster.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [organization]);

  const filteredDrivers = useMemo(() => {
    return drivers.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.employeeId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.licenseNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.mobile && d.mobile.includes(searchQuery));

      const matchesStatus = statusFilter === "ALL" || d.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [drivers, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Transport Drivers & Chauffeurs
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Licensed faculty drivers linked to Staff & HR records with license expiry audits.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/transport/drivers/new">
            <Plus className="size-3.5 mr-1.5" /> Add Driver
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft max-w-xl">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search driver name, employee ID, license..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Suspended">Suspended</option>
          </select>
        </div>
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
          <Button onClick={loadDrivers} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredDrivers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <UserCheck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No drivers registered</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Onboard drivers linked to existing Staff profiles.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/transport/drivers/new">
              <Plus className="size-3.5 mr-1" /> Add Driver
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Driver Name</th>
                <th className="py-3 px-4">Employee ID</th>
                <th className="py-3 px-4">License Number</th>
                <th className="py-3 px-4">License Expiry</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredDrivers.map((d) => {
                const licStatus = calculateDocumentStatus(
                  d.licenseExpiry,
                  settings?.docExpiryWarningDays
                );
                return (
                  <tr key={d.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{d.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-primary">{d.employeeId}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {d.licenseNumber}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`font-semibold ${
                          licStatus === "Expired"
                            ? "text-destructive font-bold"
                            : licStatus === "Expiring Soon"
                            ? "text-amber-600 font-bold"
                            : "text-foreground"
                        }`}
                      >
                        {d.licenseExpiry}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      {d.assignedVehicleNumber || <span className="text-muted-foreground italic">None</span>}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{d.mobile}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          d.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/transport/drivers/$driverId" params={{ driverId: d.id }}>
                          <Eye className="size-3.5 mr-1" /> Dossier
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
