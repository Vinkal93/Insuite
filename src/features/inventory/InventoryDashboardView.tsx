import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Package,
  Boxes,
  AlertTriangle,
  ShoppingCart,
  Wrench,
  DollarSign,
  Plus,
  RefreshCw,
  AlertCircle,
  PackagePlus,
  PackageMinus,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getInventoryDashboardStats,
  listItems,
  listMovements,
  listPurchaseOrders,
} from "@/services/inventoryService";
import type {
  InventoryDashboardStats,
  InventoryItem,
  InventoryMovement,
  PurchaseOrder,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const InventoryDashboardView: React.FC = () => {
  const { organization } = useAuth();
  const [stats, setStats] = useState<InventoryDashboardStats | null>(null);
  const [lowStockList, setLowStockList] = useState<InventoryItem[]>([]);
  const [recentMovements, setRecentMovements] = useState<InventoryMovement[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [st, items, moves, pos] = await Promise.all([
        getInventoryDashboardStats(organization.id),
        listItems(organization.id),
        listMovements(organization.id),
        listPurchaseOrders(organization.id, { status: "Submitted" }),
      ]);
      setStats(st);
      setLowStockList(
        items.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock").slice(0, 6)
      );
      setRecentMovements(moves.slice(0, 6));
      setPendingOrders(pos.slice(0, 4));
    } catch (err: any) {
      console.error("Inventory dashboard load error:", err);
      setError(err.message || "Failed to load inventory dashboard.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [organization]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-lg" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse p-4" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
          <div className="h-72 rounded-3xl bg-card border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Error Loading Inventory State</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error}</p>
        <Button onClick={loadDashboard} variant="outline" size="sm" className="mt-4 rounded-xl text-xs">
          <RefreshCw className="size-3.5 mr-1" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Inventory & Asset Management
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Consumable inventory, fixed asset lifecycle, stock ledger, and procurement workflows.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/inventory/stock-in">
              <PackagePlus className="size-3.5 mr-1.5" /> Stock In
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/inventory/stock-out">
              <PackageMinus className="size-3.5 mr-1.5" /> Issue Stock
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/inventory/assets/new">
              <Plus className="size-3.5 mr-1.5" /> Register Asset
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Consumable Items */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Consumables</span>
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Package className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-foreground">{stats?.totalItems ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Stock Valuation: ₹{(stats?.totalInventoryValue ?? 0).toLocaleString()}
          </p>
        </div>

        {/* Low Stock & Out of Stock */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500">Low / Out of Stock</span>
            <div className="size-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-rose-500">
            {(stats?.lowStockItems ?? 0) + (stats?.outOfStockItems ?? 0)}
          </p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.lowStockItems ?? 0} Low • {stats?.outOfStockItems ?? 0} Depleted
          </p>
        </div>

        {/* Fixed Assets */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Fixed Assets</span>
            <div className="size-8 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Boxes className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-blue-600">{stats?.totalAssets ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {stats?.assignedAssets ?? 0} Assigned • {stats?.assetsUnderMaintenance ?? 0} In Repair
          </p>
        </div>

        {/* Pending POs */}
        <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Pending Orders</span>
            <div className="size-8 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ShoppingCart className="size-4" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-black text-amber-600">{stats?.pendingPurchaseOrders ?? 0}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Orders Awaiting Approval / Delivery
          </p>
        </div>
      </div>

      {/* Grid: Low Stock Alert & Recent Movements */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Low Stock Alerts */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Stock Depletion Warnings</h2>
              <p className="text-xs text-muted-foreground">Items requiring immediate reordering</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/inventory/items">All Items →</Link>
            </Button>
          </div>

          {lowStockList.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              All inventory items are currently above minimum threshold levels.
            </div>
          ) : (
            <div className="space-y-3">
              {lowStockList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div>
                    <p className="text-xs font-bold text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      SKU: {item.sku} • {item.categoryName}
                    </p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Current: <strong className="text-rose-500">{item.currentStock} {item.unit}</strong> (Reorder at {item.reorderLevel})
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      item.status === "Out of Stock"
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-rose-500/10 text-rose-500 border-rose-500/20"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Movements */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Recent Stock Ledger Entries</h2>
              <p className="text-xs text-muted-foreground">Audited stock in, issues, and adjustments</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs">
              <Link to="/inventory/stock-in">Stock Movements →</Link>
            </Button>
          </div>

          {recentMovements.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground italic">
              No inventory movements recorded yet.
            </div>
          ) : (
            <div className="space-y-3">
              {recentMovements.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-border bg-surface/50 p-3.5 flex items-center justify-between gap-3 hover:bg-surface transition-all"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-[10px] px-2 py-0.5 rounded-md ${
                          m.type === "StockIn"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : m.type === "StockOut"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {m.type === "StockIn" ? "+ Stock In" : m.type === "StockOut" ? "- Issued" : m.type}
                      </span>
                      <p className="text-xs font-bold text-foreground">{m.itemName}</p>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Qty: <strong>{m.quantity}</strong> • By {m.actorName} ({m.createdAt.split("T")[0]})
                    </p>
                  </div>
                  <span className="font-mono text-xs font-bold text-foreground">
                    Bal: {m.balanceAfter}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
