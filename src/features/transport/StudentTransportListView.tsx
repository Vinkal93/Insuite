import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Route as RouteIcon,
  MapPin,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listStudentAssignments,
  listRoutes,
} from "@/services/transportService";
import type { StudentTransportAssignment, TransportRoute } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const StudentTransportListView: React.FC = () => {
  const { organization } = useAuth();
  const [assignments, setAssignments] = useState<StudentTransportAssignment[]>([]);
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [routeFilter, setRouteFilter] = useState("ALL");

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [aList, rList] = await Promise.all([
        listStudentAssignments(organization.id, { status: "Active" }),
        listRoutes(organization.id),
      ]);
      setAssignments(aList);
      setRoutes(rList);
    } catch (err: any) {
      console.error("loadStudentTransport error:", err);
      setError(err.message || "Failed to load student riders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.admissionNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.stopName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRoute = routeFilter === "ALL" || a.routeId === routeFilter;
      return matchesSearch && matchesRoute;
    });
  }, [assignments, searchQuery, routeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Student Commuter Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Active passenger manifest across all transport routes, designated stops, and morning/evening pickup windows.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/transport/assignments">
            <Plus className="size-3.5 mr-1.5" /> Manage Allocations
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
              placeholder="Search student, class, stop name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={routeFilter}
            onChange={(e) => setRouteFilter(e.target.value)}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Routes</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
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
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Users className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No student passengers found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            No active student transport allocations matching the current filters.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Admission No.</th>
                <th className="py-3 px-4">Class & Section</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Designated Stop</th>
                <th className="py-3 px-4">Option</th>
                <th className="py-3 px-4">Pickup / Drop</th>
                <th className="py-3 px-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((s) => (
                <tr key={s.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-foreground">{s.studentName}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-primary">
                    {s.admissionNumber}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {s.className} - {s.sectionName}
                  </td>
                  <td className="py-3 px-4 font-semibold text-foreground">{s.routeName}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{s.stopName}</td>
                  <td className="py-3 px-4 text-muted-foreground">{s.pickupDrop}</td>
                  <td className="py-3 px-4 font-mono text-[11px] text-muted-foreground">
                    {s.pickupTime} / {s.dropTime}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                      <Link to="/students/$studentId" params={{ studentId: s.studentId }}>
                        <ExternalLink className="size-3.5 mr-1" /> Student
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
