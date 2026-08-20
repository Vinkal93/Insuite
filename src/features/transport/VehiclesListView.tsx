import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Bus,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listVehicles,
  calculateDocumentStatus,
  getTransportSettings,
} from "@/services/transportService";
import type { TransportVehicle, TransportSettingsConfig } from "@/types/transport";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export const VehiclesListView: React.FC = () => {
  const { organization } = useAuth();
  const [vehicles, setVehicles] = useState<TransportVehicle[]>([]);
  const [settings, setSettings] = useState<TransportSettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [vList, conf] = await Promise.all([
        listVehicles(organization.id),
        getTransportSettings(organization.id),
      ]);
      setVehicles(vList);
      setSettings(conf);
    } catch (err: any) {
      console.error("loadVehicles error:", err);
      setError(err.message || "Failed to load vehicle fleet.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.registrationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.model && v.model.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType = typeFilter === "ALL" || v.type === typeFilter;
      const matchesStatus = statusFilter === "ALL" || v.status === statusFilter;

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [vehicles, searchQuery, typeFilter, statusFilter]);

  const totalPages = Math.ceil(filteredVehicles.length / ITEMS_PER_PAGE) || 1;
  const paginatedVehicles = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredVehicles.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredVehicles, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Fleet & Vehicle Registry
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage school buses, vans, compliance certificates, and route assignments.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/transport/vehicles/new">
            <Plus className="size-3.5 mr-1.5" /> Add Vehicle
          </Link>
        </Button>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search vehicle No, registration..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Vehicle Types</option>
            <option value="Bus">Bus</option>
            <option value="Van">Van</option>
            <option value="Car">Car</option>
            <option value="Other">Other</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Maintenance">In Maintenance</option>
            <option value="Retired">Retired</option>
          </select>
        </div>
      </div>

      {/* Content Table / Cards */}
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
      ) : filteredVehicles.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Bus className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No vehicles registered</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Onboard buses and transport vans to manage student commutes.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/transport/vehicles/new">
              <Plus className="size-3.5 mr-1" /> Add Vehicle
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-3 px-4">Vehicle ID</th>
                  <th className="py-3 px-4">Registration No.</th>
                  <th className="py-3 px-4">Type & Capacity</th>
                  <th className="py-3 px-4">Fuel & Ownership</th>
                  <th className="py-3 px-4">Insurance Expiry</th>
                  <th className="py-3 px-4">Fitness Expiry</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedVehicles.map((v) => {
                  const insStatus = calculateDocumentStatus(
                    v.insuranceExpiry,
                    settings?.docExpiryWarningDays
                  );
                  const fitStatus = calculateDocumentStatus(
                    v.fitnessExpiry,
                    settings?.docExpiryWarningDays
                  );
                  return (
                    <tr key={v.id} className="hover:bg-surface/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-foreground">{v.vehicleNumber}</td>
                      <td className="py-3 px-4 font-mono font-semibold text-primary">
                        {v.registrationNumber}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-semibold text-foreground">{v.type}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {v.capacity} Seats
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {v.fuelType} • {v.ownershipType}
                      </td>
                      <td className="py-3 px-4">
                        {v.insuranceExpiry ? (
                          <span
                            className={`font-semibold ${
                              insStatus === "Expired"
                                ? "text-destructive font-bold"
                                : insStatus === "Expiring Soon"
                                ? "text-amber-600 font-bold"
                                : "text-foreground"
                            }`}
                          >
                            {v.insuranceExpiry}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {v.fitnessExpiry ? (
                          <span
                            className={`font-semibold ${
                              fitStatus === "Expired"
                                ? "text-destructive font-bold"
                                : fitStatus === "Expiring Soon"
                                ? "text-amber-600 font-bold"
                                : "text-foreground"
                            }`}
                          >
                            {v.fitnessExpiry}
                          </span>
                        ) : (
                          <span className="text-muted-foreground italic">Missing</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            v.status === "Active"
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                              : v.status === "Maintenance"
                              ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                              : "bg-muted text-muted-foreground border-border"
                          }`}
                        >
                          {v.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                            <Link to="/transport/vehicles/$vehicleId" params={{ vehicleId: v.id }}>
                              <Eye className="size-3.5 mr-1" /> Dossier
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                            <Link to="/transport/vehicles/$vehicleId/edit" params={{ vehicleId: v.id }}>
                              <Edit2 className="size-3.5 text-muted-foreground" />
                            </Link>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedVehicles.map((v) => (
              <div
                key={v.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{v.vehicleNumber}</h3>
                    <p className="font-mono text-xs text-primary">{v.registrationNumber}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      v.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {v.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface/50 p-2.5 rounded-2xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Type / Seats</span>
                    <span className="font-semibold text-foreground">
                      {v.type} ({v.capacity} Seats)
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Fuel</span>
                    <span className="font-semibold text-foreground">{v.fuelType}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/transport/vehicles/$vehicleId" params={{ vehicleId: v.id }}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/transport/vehicles/$vehicleId/edit" params={{ vehicleId: v.id }}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredVehicles.length} vehicles)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl text-xs h-8"
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl text-xs h-8"
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
