import React, { useState, useEffect } from "react";
import { Bed, Search, Filter, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listHostelBeds, listHostels } from "@/services/hostelService";
import type { HostelBed, Hostel } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelBedsListView: React.FC = () => {
  const { organization } = useAuth();
  const [beds, setBeds] = useState<HostelBed[]>([]);
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostelFilter, setSelectedHostelFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bList, hList] = await Promise.all([
        listHostelBeds(organization.id, {
          hostelId: selectedHostelFilter || undefined,
          status: statusFilter || undefined,
        }),
        listHostels(organization.id),
      ]);
      setHostels(hList);

      const filtered = search
        ? bList.filter(
            (b) =>
              b.bedNumber.toLowerCase().includes(search.toLowerCase()) ||
              b.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
              (b.currentStudentName && b.currentStudentName.toLowerCase().includes(search.toLowerCase()))
          )
        : bList;
      setBeds(filtered);
    } catch (err: any) {
      console.error("loadBeds error:", err);
      setError(err.message || "Failed to load beds.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedHostelFilter, statusFilter, search]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Hostel Bed Inventory
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Unique bed units, occupancy statuses, and current student resident assignments.
        </p>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by bed number, room, or resident student..."
            className="w-full pl-9 pr-4 py-2 rounded-2xl border border-border bg-card text-xs text-foreground focus:border-primary focus:outline-none"
          />
        </div>

        <select
          value={selectedHostelFilter}
          onChange={(e) => setSelectedHostelFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Hostels</option>
          {hostels.map((h) => (
            <option key={h.id} value={h.id}>
              {h.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-2xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
        >
          <option value="">All Bed Statuses</option>
          <option value="Available">Available</option>
          <option value="Occupied">Occupied</option>
          <option value="Maintenance">Maintenance</option>
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
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : beds.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Bed className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No beds matching filters</h3>
          <p className="mt-1 text-xs text-muted-foreground">Configure rooms to generate bed inventory.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {beds.map((b) => (
            <div
              key={b.id}
              className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-2 text-xs hover:border-primary/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{b.bedNumber}</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    b.status === "Available"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : b.status === "Occupied"
                      ? "bg-purple-500/10 text-purple-600 border-purple-500/20"
                      : "bg-secondary text-muted-foreground border-border"
                  }`}
                >
                  {b.status}
                </span>
              </div>

              <div className="space-y-0.5 text-[11px]">
                <p className="font-semibold text-foreground">Room: {b.roomNumber}</p>
                {b.currentStudentName ? (
                  <p className="text-muted-foreground">
                    Resident: <strong className="text-foreground">{b.currentStudentName}</strong>
                  </p>
                ) : (
                  <p className="text-emerald-600 font-semibold">Vacant / Ready for Assignment</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
