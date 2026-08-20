import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Route as RouteIcon,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Bus,
  UserCheck,
  MapPin,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listRoutes } from "@/services/transportService";
import type { TransportRoute } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const RoutesListView: React.FC = () => {
  const { organization } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const loadRoutes = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listRoutes(organization.id);
      setRoutes(data);
    } catch (err: any) {
      console.error("loadRoutes error:", err);
      setError(err.message || "Failed to load transit routes.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, [organization]);

  const filteredRoutes = useMemo(() => {
    return routes.filter((r) => {
      const matchesSearch =
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.vehicleNumber && r.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (r.driverName && r.driverName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [routes, searchQuery, statusFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Transport Routes & Schedules
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Design pickup/drop paths, stops sequences, vehicle allocations, and timing windows.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/transport/routes/new">
            <Plus className="size-3.5 mr-1.5" /> Create Route
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
              placeholder="Search route name, code, vehicle..."
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
          <Button onClick={loadRoutes} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredRoutes.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <RouteIcon className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No transport routes configured</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Create school transit routes with ordered stops and assign vehicles.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/transport/routes/new">
              <Plus className="size-3.5 mr-1" /> Create Route
            </Link>
          </Button>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Route Name</th>
                <th className="py-3 px-4">Route Code</th>
                <th className="py-3 px-4">Assigned Vehicle</th>
                <th className="py-3 px-4">Primary Driver</th>
                <th className="py-3 px-4">Stops</th>
                <th className="py-3 px-4">Students</th>
                <th className="py-3 px-4">Timings</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRoutes.map((r) => (
                <tr key={r.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{r.name}</td>
                  <td className="py-3 px-4 font-mono font-bold text-primary">{r.code}</td>
                  <td className="py-3 px-4 text-foreground font-semibold">
                    {r.vehicleNumber || <span className="text-muted-foreground italic">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {r.driverName || <span className="text-muted-foreground italic">Unassigned</span>}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">
                    {(r.stops || []).length} Stops
                  </td>
                  <td className="py-3 px-4 font-bold text-emerald-600">
                    {r.totalStudentsAssigned}
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                    {r.startTime} - {r.endTime}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        r.status === "Active"
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                          : "bg-muted text-muted-foreground border-border"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                      <Link to="/transport/routes/$routeId" params={{ routeId: r.id }}>
                        <Eye className="size-3.5 mr-1" /> View
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
