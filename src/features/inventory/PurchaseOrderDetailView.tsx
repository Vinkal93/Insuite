import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  PackageCheck,
  Truck,
  Send,
  AlertCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getPurchaseOrder,
  updatePurchaseOrderStatus,
  receivePurchaseOrder,
} from "@/services/inventoryService";
import type { PurchaseOrder, PurchaseOrderStatus } from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const PurchaseOrderDetailView: React.FC = () => {
  const { orderId } = useParams({ from: "/inventory/purchase-orders/$orderId" });
  const { organization, firebaseUser, userProfile } = useAuth();

  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Receiving Modal State
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [receivedMap, setReceivedMap] = useState<Record<string, number>>({});
  const [isReceiving, setIsReceiving] = useState(false);

  const loadData = async () => {
    if (!organization || !orderId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPurchaseOrder(organization.id, orderId);
      setPO(data);
      if (data) {
        const initialMap: Record<string, number> = {};
        data.items.forEach((it) => {
          const remaining = Math.max(0, it.quantity - it.receivedQuantity);
          initialMap[it.itemId] = remaining;
        });
        setReceivedMap(initialMap);
      }
    } catch (err: any) {
      console.error("PO detail load error:", err);
      setError(err.message || "Failed to load purchase order.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, orderId]);

  const handleStatusTransition = async (status: PurchaseOrderStatus) => {
    if (!organization || !firebaseUser || !orderId) return;
    let cancelReason: string | undefined = undefined;
    if (status === "Cancelled") {
      const promptRes = prompt("Enter cancellation reason:");
      if (!promptRes) return;
      cancelReason = promptRes;
    }

    try {
      await updatePurchaseOrderStatus(
        organization.id,
        orderId,
        status,
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" },
        cancelReason
      );
      await loadData();
    } catch (err: any) {
      alert("Failed to update status: " + err.message);
    }
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !orderId || !po) return;

    const payload = po.items.map((it) => ({
      itemId: it.itemId,
      receivedQty: Number(receivedMap[it.itemId]) || 0,
    }));

    const totalToReceive = payload.reduce((acc, p) => acc + p.receivedQty, 0);
    if (totalToReceive <= 0) {
      alert("Please enter receiving quantity greater than 0 for at least one item.");
      return;
    }

    setIsReceiving(true);
    try {
      await receivePurchaseOrder(organization.id, orderId, payload, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      setShowReceiveModal(false);
      await loadData();
    } catch (err: any) {
      alert("Failed to receive stock: " + err.message);
    } finally {
      setIsReceiving(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !po) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Purchase Order Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The purchase order record does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/inventory/purchase-orders">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Orders
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
              <ShoppingCart className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground font-mono">{po.poNumber}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    po.status === "Received"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : po.status === "Approved" || po.status === "Ordered"
                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                      : po.status === "Partially Received"
                      ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      : po.status === "Cancelled"
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {po.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Vendor: <strong className="text-foreground">{po.vendorName}</strong> • Date:{" "}
                {po.orderDate} • Expected: {po.expectedDelivery || "Unspecified"}
              </p>
            </div>
          </div>

          {/* Workflow Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            {po.status === "Draft" && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => handleStatusTransition("Submitted")}
                className="rounded-xl text-xs font-bold h-8"
              >
                <Send className="size-3.5 mr-1" /> Submit for Approval
              </Button>
            )}

            {po.status === "Submitted" && (
              <>
                <Button
                  variant="hero"
                  size="sm"
                  onClick={() => handleStatusTransition("Approved")}
                  className="rounded-xl text-xs font-bold h-8"
                >
                  <CheckCircle2 className="size-3.5 mr-1" /> Approve Order
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusTransition("Cancelled")}
                  className="rounded-xl text-xs h-8 text-destructive border-destructive/20 hover:bg-destructive/10"
                >
                  <XCircle className="size-3.5 mr-1" /> Reject
                </Button>
              </>
            )}

            {po.status === "Approved" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusTransition("Ordered")}
                className="rounded-xl text-xs h-8"
              >
                <Truck className="size-3.5 mr-1" /> Mark Dispatched / Ordered
              </Button>
            )}

            {(po.status === "Approved" || po.status === "Ordered" || po.status === "Partially Received") && (
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowReceiveModal(true)}
                className="rounded-xl text-xs font-bold h-8 shadow-soft"
              >
                <PackageCheck className="size-3.5 mr-1" /> Receive Stock
              </Button>
            )}
          </div>
        </div>

        {/* Financial Summary Strip */}
        <div className="grid gap-3 sm:grid-cols-4 pt-2 border-t border-border">
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Subtotal</span>
            <p className="text-base font-mono font-bold text-foreground mt-0.5">
              ₹{po.subtotal.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Discount</span>
            <p className="text-base font-mono font-bold text-foreground mt-0.5">
              ₹{po.discountTotal.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface/50 p-3">
            <span className="text-[10px] text-muted-foreground uppercase font-bold">Taxes</span>
            <p className="text-base font-mono font-bold text-foreground mt-0.5">
              ₹{po.taxTotal.toLocaleString()}
            </p>
          </div>
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-3">
            <span className="text-[10px] text-primary uppercase font-bold">Final Total Amount</span>
            <p className="text-lg font-mono font-black text-primary mt-0.5">
              ₹{po.total.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Line Items Detail */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Purchased Items & Receiving Progress</h2>
            <p className="text-xs text-muted-foreground">Detailed status per ordered line item</p>
          </div>
        </div>

        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-2.5 px-4">Item Name</th>
                <th className="py-2.5 px-4">SKU</th>
                <th className="py-2.5 px-4">Ordered Qty</th>
                <th className="py-2.5 px-4">Received Qty</th>
                <th className="py-2.5 px-4">Unit Cost (₹)</th>
                <th className="py-2.5 px-4">Tax %</th>
                <th className="py-2.5 px-4 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {po.items.map((it) => (
                <tr key={it.itemId} className="hover:bg-surface/50">
                  <td className="py-2.5 px-4 font-bold text-foreground">{it.itemName}</td>
                  <td className="py-2.5 px-4 font-mono text-primary">{it.itemSku}</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-foreground">{it.quantity}</td>
                  <td className="py-2.5 px-4 font-mono font-bold">
                    <span
                      className={
                        it.receivedQuantity >= it.quantity
                          ? "text-emerald-600"
                          : it.receivedQuantity > 0
                          ? "text-amber-600"
                          : "text-muted-foreground"
                      }
                    >
                      {it.receivedQuantity} / {it.quantity}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono">₹{it.unitCost}</td>
                  <td className="py-2.5 px-4 font-mono">{it.taxPercent}%</td>
                  <td className="py-2.5 px-4 font-mono font-bold text-right text-foreground">
                    ₹{it.total.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {po.notes && (
          <div className="rounded-2xl border border-border bg-surface/50 p-4 text-xs text-muted-foreground">
            <strong className="text-foreground block mb-0.5">PO Notes:</strong>
            {po.notes}
          </div>
        )}
      </div>

      {/* Stock Receiving Modal */}
      {showReceiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">
              Receive Shipment for {po.poNumber}
            </h3>
            <p className="text-xs text-muted-foreground">
              Enter verified physical quantities received. Stock balances will update automatically in real-time.
            </p>

            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                {po.items.map((it) => {
                  const remaining = Math.max(0, it.quantity - it.receivedQuantity);
                  return (
                    <div
                      key={it.itemId}
                      className="rounded-2xl border border-border bg-surface/50 p-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="text-xs font-bold text-foreground">{it.itemName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          Ordered: {it.quantity} • Received previously: {it.receivedQuantity} (Remaining: {remaining})
                        </p>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min={0}
                          max={remaining}
                          value={receivedMap[it.itemId] ?? 0}
                          onChange={(e) =>
                            setReceivedMap({
                              ...receivedMap,
                              [it.itemId]: Number(e.target.value),
                            })
                          }
                          className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono font-bold text-xs text-foreground text-right focus:border-primary focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowReceiveModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isReceiving}
                  className="rounded-xl text-xs font-bold"
                >
                  {isReceiving ? "Updating Stock..." : "Confirm & Update Inventory"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
