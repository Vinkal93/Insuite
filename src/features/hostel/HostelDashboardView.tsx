import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  Bed,
  Users,
  CalendarCheck,
  Plane,
  AlertCircle,
  Wrench,
  CreditCard,
  Plus,
  RefreshCw,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getHostelDashboardStats, listHostelAllocations } from "@/services/hostelService";
import type { HostelDashboardStats, HostelAllocation } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<HostelDashboardStats | null>(null);
  const [recentAllocations, setRecentAllocations] = useState<HostelAllocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [s, allocs] = await Promise.all([
        getHostelDashboardStats(organization.id),
        listHostelAllocations(organization.id),
      ]);
      setStats(s);
      setRecentAllocations(allocs.slice(0, 6));
    } catch (err: any) {
      console.error("loadHostelDashboard error:", err);
      setError(err.message || "Failed to load hostel dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostel & Residential Life
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Boarding houses, buildings, rooms, bed allocations, night roll-calls, and leave passes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 self-start sm:self-auto">
          <Link
            to="/hostel/allocations/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity"
          >
            <Plus className="size-4" /> Allocate Bed
          </Link>
          <Link
            to="/hostel/hostels/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-card border border-border text-foreground text-xs font-bold hover:border-primary transition-colors"
          >
            <Building2 className="size-4" /> New Hostel
          </Link>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-card border border-border animate-pulse" />
            ))}
          </div>
          <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : (
        <>
          {/* 4 Primary Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Total Hostels</span>
                <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                  <Building2 className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.totalHostelsCount || 0}
              </p>
              <Link to="/hostel/hostels" className="text-[11px] font-bold text-primary hover:underline">
                View Hostels →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Occupied Beds</span>
                <div className="size-8 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                  <Bed className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-purple-600">
                {stats?.occupiedBedsCount || 0}{" "}
                <span className="text-xs text-muted-foreground font-semibold">
                  / {stats?.totalCapacity || 0}
                </span>
              </p>
              <span className="text-[11px] text-muted-foreground font-semibold">
                {stats?.availableBedsCount || 0} Beds Available
              </span>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Students in Hostel</span>
                <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                  <Users className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-emerald-600">
                {stats?.activeAllocationsCount || 0}
              </p>
              <Link to="/hostel/students" className="text-[11px] font-bold text-primary hover:underline">
                Hostel Roster →
              </Link>
            </div>

            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground">Pending Leaves</span>
                <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                  <Plane className="size-4" />
                </div>
              </div>
              <p className="text-2xl font-black text-foreground">
                {stats?.pendingLeavesCount || 0}
              </p>
              <Link to="/hostel/leave" className="text-[11px] font-bold text-primary hover:underline">
                Review Leaves →
              </Link>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Link
              to="/hostel/attendance"
              className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <CalendarCheck className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-foreground">Night Attendance</h4>
                <p className="text-[10px] text-muted-foreground">Take daily hostel roll call</p>
              </div>
            </Link>

            <Link
              to="/hostel/complaints"
              className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="size-10 rounded-2xl bg-rose-500/10 text-rose-600 flex items-center justify-center">
                <AlertCircle className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-foreground">
                  Complaints ({stats?.openComplaintsCount || 0})
                </h4>
                <p className="text-[10px] text-muted-foreground">Student maintenance tickets</p>
              </div>
            </Link>

            <Link
              to="/hostel/fees"
              className="rounded-3xl border border-border bg-card p-4 shadow-soft flex items-center gap-3 hover:border-primary/40 transition-colors"
            >
              <div className="size-10 rounded-2xl bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
                <CreditCard className="size-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-foreground">Hostel Fee Dues</h4>
                <p className="text-[10px] text-muted-foreground">Integrated with Finance CRM</p>
              </div>
            </Link>
          </div>

          {/* Recent Bed Allocations */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-extrabold text-foreground">Recent Bed Allocations</h3>
              <Link to="/hostel/allocations" className="text-xs font-bold text-primary hover:underline">
                All Allocations →
              </Link>
            </div>

            {recentAllocations.length === 0 ? (
              <div className="bg-surface/30 p-8 rounded-2xl border border-dashed border-border text-center text-xs text-muted-foreground">
                No active hostel bed allocations. Click "Allocate Bed" to assign boarding students.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {recentAllocations.map((a) => (
                  <div
                    key={a.id}
                    className="p-4 rounded-2xl border border-border bg-surface/50 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-bold text-foreground block">{a.studentName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          Adm: {a.admissionNumber || "N/A"}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {a.status}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-border/50 text-[10px] space-y-0.5 font-mono">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hostel:</span>
                        <span className="font-semibold text-foreground">{a.hostelName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Room & Bed:</span>
                        <span className="font-bold text-primary">
                          Rm {a.roomNumber} • {a.bedNumber}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Allocated:</span>
                        <span>{a.allocationDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
