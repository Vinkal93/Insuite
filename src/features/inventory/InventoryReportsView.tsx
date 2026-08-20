import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  Package,
  Boxes,
  AlertTriangle,
  ArrowLeftRight,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listItems,
  listAssets,
  listMovements,
  listAssetTransfers,
} from "@/services/inventoryService";
import type {
  InventoryItem,
  InventoryAsset,
  InventoryMovement,
  AssetTransfer,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const InventoryReportsView: React.FC = () => {
  const { organization } = useAuth();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [assets, setAssets] = useState<InventoryAsset[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [itList, astList, mList, trList] = await Promise.all([
        listItems(organization.id),
        listAssets(organization.id),
        listMovements(organization.id),
        listAssetTransfers(organization.id),
      ]);
      setItems(itList);
      setAssets(astList);
      setMovements(mList);
      setTransfers(trList);
    } catch (err: any) {
      console.error("loadReportsData error:", err);
      setError(err.message || "Failed to load reports data.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  // Export CSV Helper
  const downloadCSV = (filename: string, headers: string[], rows: (string | number)[][]) => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.map((val) => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${filename}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportStockValuation = () => {
    const headers = ["Item Name", "SKU", "Category", "Unit", "Current Stock", "Unit Cost (INR)", "Valuation (INR)", "Status"];
    const rows = items.map((i) => [
      i.name,
      i.sku,
      i.categoryName,
      i.unit,
      i.currentStock,
      i.unitCost,
      i.currentStock * i.unitCost,
      i.status,
    ]);
    downloadCSV("inventory_stock_valuation", headers, rows);
  };

  const exportLowStock = () => {
    const lowItems = items.filter((i) => i.status === "Low Stock" || i.status === "Out of Stock");
    const headers = ["Item Name", "SKU", "Category", "Current Stock", "Reorder Level", "Minimum Stock", "Status"];
    const rows = lowItems.map((i) => [
      i.name,
      i.sku,
      i.categoryName,
      i.currentStock,
      i.reorderLevel,
      i.minimumStock,
      i.status,
    ]);
    downloadCSV("inventory_low_stock_reorder", headers, rows);
  };

  const exportAssetRegister = () => {
    const headers = ["Asset Code", "Asset Name", "Category", "Serial Number", "Location", "Custodian", "Purchase Price (INR)", "Condition", "Status"];
    const rows = assets.map((a) => [
      a.assetCode,
      a.name,
      a.categoryName,
      a.serialNumber || "—",
      a.locationName || "—",
      a.assignedToStaffName || "Unassigned",
      a.purchasePrice || 0,
      a.condition,
      a.status,
    ]);
    downloadCSV("fixed_asset_register", headers, rows);
  };

  const exportStockMovements = () => {
    const headers = ["Date", "Item Name", "SKU", "Movement Type", "Quantity", "Balance After", "Purpose/Recipient", "Authorized By"];
    const rows = movements.map((m) => [
      m.createdAt.split("T")[0],
      m.itemName,
      m.itemSku,
      m.type,
      m.quantity,
      m.balanceAfter,
      m.issuedTo ? `${m.issuedTo} - ${m.purpose || ""}` : m.notes || "—",
      m.actorName,
    ]);
    downloadCSV("inventory_movements_ledger", headers, rows);
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto" />
        <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
        <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
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
            Inventory & Asset Reports
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Export official audited CSV data sheets for accounting, stock replenishment, and asset depreciation.
          </p>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 1. Stock Valuation */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Package className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Current Stock & Valuation</h2>
              <p className="text-xs text-muted-foreground">
                Total item count: {items.length} consumable lines
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete inventory valuation showing unit cost, stock on hand, and total currency balance.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportStockValuation}
            disabled={items.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Stock Valuation (.CSV)
          </Button>
        </div>

        {/* 2. Low Stock Reorder */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <AlertTriangle className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Low Stock & Reorder Audit</h2>
              <p className="text-xs text-muted-foreground">
                Items requiring replenishment
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Filters out-of-stock and low-stock items breaching minimum reorder threshold levels.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportLowStock}
            disabled={items.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Reorder Report (.CSV)
          </Button>
        </div>

        {/* 3. Fixed Asset Register */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Boxes className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Fixed Asset Register</h2>
              <p className="text-xs text-muted-foreground">
                Total registered assets: {assets.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete capital asset register with serial numbers, purchase valuation, custodians, and room locations.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportAssetRegister}
            disabled={assets.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Asset Register (.CSV)
          </Button>
        </div>

        {/* 4. Movements Ledger */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <ArrowLeftRight className="size-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Stock Ledger Movements</h2>
              <p className="text-xs text-muted-foreground">
                Total audit entries: {movements.length}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Detailed log of all inward receptions, department issuances, and physical stock count adjustments.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={exportStockMovements}
            disabled={movements.length === 0}
            className="w-full rounded-xl text-xs font-bold"
          >
            <Download className="size-3.5 mr-1.5" /> Export Ledger Audit (.CSV)
          </Button>
        </div>
      </div>
    </div>
  );
};
