import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Package,
  ArrowLeft,
  PackagePlus,
  PackageMinus,
  SlidersHorizontal,
  Clock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getItem,
  listMovements,
  adjustStock,
} from "@/services/inventoryService";
import type { InventoryItem, InventoryMovement } from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const InventoryItemDetailView: React.FC = () => {
  const { itemId } = useParams({ from: "/inventory/items/$itemId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [item, setItem] = useState<InventoryItem | null>(null);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Stock Adjustment Modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [newQty, setNewQty] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState("");
  const [isAdjusting, setIsAdjusting] = useState(false);

  const loadData = async () => {
    if (!organization || !itemId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [it, movs] = await Promise.all([
        getItem(organization.id, itemId),
        listMovements(organization.id, { itemId }),
      ]);
      setItem(it);
      setMovements(movs);
      if (it) setNewQty(it.currentStock);
    } catch (err: any) {
      console.error("Item detail load error:", err);
      setError(err.message || "Failed to load item ledger.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, itemId]);

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !itemId) return;
    if (!adjustReason.trim()) {
      alert("Please provide a reason for the stock adjustment.");
      return;
    }

    setIsAdjusting(true);
    try {
      await adjustStock(
        organization.id,
        {
          itemId,
          newStockQuantity: Number(newQty),
          reason: adjustReason.trim(),
          date: new Date().toISOString().split("T")[0],
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowAdjustModal(false);
      setAdjustReason("");
      await loadData();
    } catch (err: any) {
      alert("Failed to adjust stock: " + err.message);
    } finally {
      setIsAdjusting(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !item) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Item Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The inventory item does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/inventory/items">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Catalog
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="size-14 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
              <Package className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{item.name}</h1>
                <span className="font-mono text-xs font-bold text-primary px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20">
                  {item.sku}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    item.status === "In Stock"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : item.status === "Low Stock"
                      ? "bg-rose-500/10 text-rose-500 border-rose-500/20"
                      : "bg-destructive/10 text-destructive border-destructive/20"
                  }`}
                >
                  {item.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Category: {item.categoryName} • Unit: {item.unit} • Location:{" "}
                {item.defaultLocationName || "Central Store"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/inventory/stock-in">
                <PackagePlus className="size-3.5 mr-1" /> Stock In
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
              <Link to="/inventory/stock-out">
                <PackageMinus className="size-3.5 mr-1" /> Issue
              </Link>
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={() => {
                setNewQty(item.currentStock);
                setShowAdjustModal(true);
              }}
              className="rounded-xl text-xs font-bold h-8 shadow-soft"
            >
              <SlidersHorizontal className="size-3.5 mr-1" /> Adjust Stock
            </Button>
          </div>
        </div>

        {/* Stats Ribbon */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Current Available
            </span>
            <p className="text-lg font-black text-foreground mt-0.5">
              {item.currentStock} {item.unit}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Reorder Trigger
            </span>
            <p className="text-xs font-bold text-foreground mt-1">
              At {item.reorderLevel} {item.unit} (Min: {item.minimumStock})
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Unit Cost</span>
            <p className="text-lg font-black text-foreground mt-0.5">₹{item.unitCost}</p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">
              Total Stock Value
            </span>
            <p className="text-lg font-black text-emerald-600 mt-0.5">
              ₹{(item.currentStock * item.unitCost).toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Movements Ledger */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Stock Movement Ledger</h2>
            <p className="text-xs text-muted-foreground">Historical audit log for this item</p>
          </div>
        </div>

        {movements.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No stock movements recorded for this item.
          </p>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-2.5 px-4">Date</th>
                  <th className="py-2.5 px-4">Movement Type</th>
                  <th className="py-2.5 px-4">Quantity</th>
                  <th className="py-2.5 px-4">Balance After</th>
                  <th className="py-2.5 px-4">Recipient / Purpose</th>
                  <th className="py-2.5 px-4">Authorized By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-surface/50">
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {m.createdAt.split("T")[0]}
                    </td>
                    <td className="py-2.5 px-4">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                          m.type === "StockIn"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : m.type === "StockOut"
                            ? "bg-rose-500/10 text-rose-500"
                            : "bg-blue-500/10 text-blue-600"
                        }`}
                      >
                        {m.type}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                      {m.type === "StockOut" ? `-${m.quantity}` : `+${m.quantity}`}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                      {m.balanceAfter}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">
                      {m.issuedTo ? `${m.issuedTo} (${m.purpose || ""})` : m.notes || "—"}
                    </td>
                    <td className="py-2.5 px-4 text-muted-foreground">{m.actorName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Adjust Stock Modal */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Audit Stock Adjustment: {item.name}
            </h3>

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Physical Stock Count *
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={newQty}
                  onChange={(e) => setNewQty(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Adjustment Reason *
                </label>
                <textarea
                  rows={2}
                  required
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Physical inventory audit discrepancy, damaged stock disposal"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAdjustModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isAdjusting}
                  className="rounded-xl text-xs font-bold"
                >
                  {isAdjusting ? "Adjusting..." : "Confirm Adjustment"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
