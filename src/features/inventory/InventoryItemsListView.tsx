import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  Package,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  PackagePlus,
  PackageMinus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listItems, listCategories } from "@/services/inventoryService";
import type { InventoryItem, InventoryCategory } from "@/types/inventory";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export const InventoryItemsListView: React.FC = () => {
  const { organization } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [itList, catList] = await Promise.all([
        listItems(organization.id),
        listCategories(organization.id),
      ]);
      setItems(itList);
      setCategories(catList);
    } catch (err: any) {
      console.error("loadItems error:", err);
      setError(err.message || "Failed to load inventory items.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch =
        i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (i.description && i.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = categoryFilter === "ALL" || i.categoryId === categoryFilter;
      const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [items, searchQuery, categoryFilter, statusFilter]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Inventory & Stock Catalog
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consumable supplies, laboratory chemicals, stationery, and spare parts inventory.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/inventory/stock-in">
              <PackagePlus className="size-3.5 mr-1" /> Stock In
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/inventory/items/new">
              <Plus className="size-3.5 mr-1.5" /> Add Item
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search item name, SKU..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
            <option value="Inactive">Inactive</option>
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
      ) : filteredItems.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Package className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No inventory items found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Onboard consumable stock items, chemicals, or institutional supplies.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/inventory/items/new">
              <Plus className="size-3.5 mr-1" /> Add Item
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
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Unit</th>
                  <th className="py-3 px-4">Current Stock</th>
                  <th className="py-3 px-4">Reorder Level</th>
                  <th className="py-3 px-4">Unit Cost (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedItems.map((i) => (
                  <tr key={i.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-bold text-foreground">{i.name}</td>
                    <td className="py-3 px-4 font-mono font-semibold text-primary">{i.sku}</td>
                    <td className="py-3 px-4 text-muted-foreground">{i.categoryName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{i.unit}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      {i.currentStock}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{i.reorderLevel}</td>
                    <td className="py-3 px-4 font-mono font-semibold">₹{i.unitCost}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          i.status === "In Stock"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : i.status === "Low Stock"
                            ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                            : "bg-destructive/10 text-destructive border-destructive/20"
                        }`}
                      >
                        {i.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/inventory/items/$itemId" params={{ itemId: i.id }}>
                          <Eye className="size-3.5 mr-1" /> Ledger
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
            {paginatedItems.map((i) => (
              <div
                key={i.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">{i.name}</h3>
                    <p className="font-mono text-xs text-primary">{i.sku}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      i.status === "In Stock"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    }`}
                  >
                    {i.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface/50 p-2.5 rounded-2xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Stock</span>
                    <span className="font-bold text-foreground font-mono">
                      {i.currentStock} {i.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Cost</span>
                    <span className="font-semibold text-foreground">₹{i.unitCost}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/inventory/items/$itemId" params={{ itemId: i.id }}>
                      View Ledger
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
                Showing page {currentPage} of {totalPages} ({filteredItems.length} items)
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
