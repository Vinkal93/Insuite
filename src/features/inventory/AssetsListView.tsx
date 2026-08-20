import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Boxes,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  MapPin,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listAssets, listCategories, listLocations } from "@/services/inventoryService";
import type { InventoryAsset, InventoryCategory, InventoryLocation } from "@/types/inventory";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export const AssetsListView: React.FC = () => {
  const { organization } = useAuth();
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [locationFilter, setLocationFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [astList, catList, locList] = await Promise.all([
        listAssets(organization.id),
        listCategories(organization.id, "Fixed Asset"),
        listLocations(organization.id),
      ]);
      setAssets(astList);
      setCategories(catList);
      setLocations(locList);
    } catch (err: any) {
      console.error("loadAssets error:", err);
      setError(err.message || "Failed to load asset inventory.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredAssets = useMemo(() => {
    return assets.filter((a) => {
      const matchesSearch =
        a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.assetCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (a.serialNumber && a.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (a.assignedToStaffName &&
          a.assignedToStaffName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === "ALL" || a.categoryId === categoryFilter;
      const matchesStatus = statusFilter === "ALL" || a.status === statusFilter;
      const matchesLoc = locationFilter === "ALL" || a.locationId === locationFilter;

      return matchesSearch && matchesCat && matchesStatus && matchesLoc;
    });
  }, [assets, searchQuery, categoryFilter, statusFilter, locationFilter]);

  const totalPages = Math.ceil(filteredAssets.length / ITEMS_PER_PAGE) || 1;
  const paginatedAssets = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAssets.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAssets, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Fixed Asset Register
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Computers, lab hardware, audio-visual gear, campus furniture, and physical equipment.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/inventory/assets/new">
            <Plus className="size-3.5 mr-1.5" /> Register Asset
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-4 max-w-3xl">
          <div className="relative sm:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search code, name, serial..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={locationFilter}
            onChange={(e) => {
              setLocationFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Locations</option>
            {locations.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
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
            <option value="Available">Available</option>
            <option value="Assigned">Assigned</option>
            <option value="Maintenance">In Maintenance</option>
            <option value="Lost">Lost</option>
            <option value="Damaged">Damaged</option>
            <option value="Retired">Retired</option>
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
      ) : filteredAssets.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Boxes className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No assets found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Onboard computers, projectors, lab apparatus, and institutional assets.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/inventory/assets/new">
              <Plus className="size-3.5 mr-1" /> Register Asset
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
                  <th className="py-3 px-4">Asset ID</th>
                  <th className="py-3 px-4">Asset Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Serial Number</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Assigned To</th>
                  <th className="py-3 px-4">Condition</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{a.assetCode}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{a.name}</td>
                    <td className="py-3 px-4 text-muted-foreground">{a.categoryName}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {a.serialNumber || "—"}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{a.locationName || "—"}</td>
                    <td className="py-3 px-4 text-foreground font-semibold">
                      {a.assignedToStaffName || <span className="text-muted-foreground italic">Unassigned</span>}
                    </td>
                    <td className="py-3 px-4">{a.condition}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          a.status === "Available"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : a.status === "Assigned"
                            ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                            : a.status === "Maintenance"
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/inventory/assets/$assetId" params={{ assetId: a.id }}>
                          <Eye className="size-3.5 mr-1" /> Dossier
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedAssets.map((a) => (
              <div
                key={a.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{a.name}</h3>
                    <p className="font-mono text-xs text-primary">{a.assetCode}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      a.status === "Available"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : a.status === "Assigned"
                        ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {a.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface/50 p-2.5 rounded-2xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Location</span>
                    <span className="font-semibold text-foreground">
                      {a.locationName || "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Custodian</span>
                    <span className="font-semibold text-foreground">
                      {a.assignedToStaffName || "None"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/inventory/assets/$assetId" params={{ assetId: a.id }}>
                      View Dossier
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
                Showing page {currentPage} of {totalPages} ({filteredAssets.length} assets)
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
