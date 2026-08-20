import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  ArrowLeft,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createPurchaseOrder,
  listVendors,
  listItems,
} from "@/services/inventoryService";
import type { InventoryVendor, InventoryItem } from "@/types/inventory";
import type { PurchaseOrderInput } from "@/schemas/inventory";
import { Button } from "@/components/ui/button";

interface LineItemDraft {
  itemId: string;
  quantity: number;
  unitCost: number;
  taxPercent: number;
  discountAmount: number;
}

export const CreatePurchaseOrderView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [vendorId, setVendorId] = useState("");
  const [orderDate, setOrderDate] = useState(new Date().toISOString().split("T")[0]);
  const [expectedDelivery, setExpectedDelivery] = useState("");
  const [notes, setNotes] = useState("");

  // Line items draft
  const [lineItems, setLineItems] = useState<LineItemDraft[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [vList, itList] = await Promise.all([
          listVendors(organization.id),
          listItems(organization.id),
        ]);
        setVendors(vList);
        setItems(itList);
        if (vList.length > 0) setVendorId(vList[0].id);
        if (itList.length > 0) {
          setLineItems([
            {
              itemId: itList[0].id,
              quantity: 1,
              unitCost: itList[0].unitCost,
              taxPercent: 0,
              discountAmount: 0,
            },
          ]);
        }
      } catch (err: any) {
        console.error("Init PO form error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const addLineItem = () => {
    if (items.length === 0) return;
    setLineItems([
      ...lineItems,
      {
        itemId: items[0].id,
        quantity: 1,
        unitCost: items[0].unitCost,
        taxPercent: 0,
        discountAmount: 0,
      },
    ]);
  };

  const removeLineItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const updateLineItem = (index: number, field: keyof LineItemDraft, value: any) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "itemId") {
      const match = items.find((i) => i.id === value);
      if (match) updated[index].unitCost = match.unitCost;
    }

    setLineItems(updated);
  };

  // Calculations
  const calculated = lineItems.reduce(
    (acc, row) => {
      const lineSubtotal = Number(row.quantity) * Number(row.unitCost);
      const lineDiscount = Number(row.discountAmount) || 0;
      const lineTaxable = Math.max(0, lineSubtotal - lineDiscount);
      const lineTax = (lineTaxable * (Number(row.taxPercent) || 0)) / 100;
      const lineTotal = lineTaxable + lineTax;

      return {
        subtotal: acc.subtotal + lineSubtotal,
        discountTotal: acc.discountTotal + lineDiscount,
        taxTotal: acc.taxTotal + lineTax,
        grandTotal: acc.grandTotal + lineTotal,
      };
    },
    { subtotal: 0, discountTotal: 0, taxTotal: 0, grandTotal: 0 }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!vendorId) {
      setError("Please select a vendor.");
      return;
    }
    if (lineItems.length === 0) {
      setError("Please add at least one line item to the purchase order.");
      return;
    }

    // Build payload items
    const poItems = lineItems.map((li) => {
      const it = items.find((i) => i.id === li.itemId);
      return {
        itemId: li.itemId,
        itemName: it?.name || "Item",
        itemSku: it?.sku || "SKU",
        quantity: Number(li.quantity),
        unitCost: Number(li.unitCost),
        taxPercent: Number(li.taxPercent) || 0,
        discountAmount: Number(li.discountAmount) || 0,
      };
    });

    const input: PurchaseOrderInput = {
      vendorId,
      orderDate,
      expectedDelivery: expectedDelivery || null,
      items: poItems,
      notes: notes.trim() || null,
    };

    setIsSubmitting(true);
    try {
      const po = await createPurchaseOrder(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      navigate({ to: "/inventory/purchase-orders/$orderId", params: { orderId: po.id } });
    } catch (err: any) {
      console.error("createPurchaseOrder error:", err);
      setError(err.message || "Failed to create purchase order.");
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/inventory/purchase-orders">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Create Purchase Order
            </h1>
            <p className="text-xs text-muted-foreground">
              Prepare procurement requisition with automatic decimal-safe financial calculations.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor & Dates */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            General PO Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Vendor / Supplier *
              </label>
              {vendors.length === 0 ? (
                <p className="text-xs text-destructive">
                  No vendors found. Please add a vendor first.
                </p>
              ) : (
                <select
                  value={vendorId}
                  onChange={(e) => setVendorId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {vendors.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Order Issue Date *
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDelivery}
                onChange={(e) => setExpectedDelivery(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Line Items */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-sm font-extrabold text-foreground">Purchase Line Items</h2>
              <p className="text-xs text-muted-foreground">Specify quantities, agreed pricing, and applicable taxes</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addLineItem}
              className="rounded-xl text-xs h-8"
            >
              <Plus className="size-3.5 mr-1" /> Add Item Line
            </Button>
          </div>

          {lineItems.length === 0 ? (
            <p className="text-xs text-muted-foreground italic py-6 text-center">
              No items added. Click "Add Item Line" to specify purchase items.
            </p>
          ) : (
            <div className="space-y-3">
              {lineItems.map((li, index) => {
                const lineSub = Number(li.quantity) * Number(li.unitCost);
                const lineDisc = Number(li.discountAmount) || 0;
                const lineTax = (Math.max(0, lineSub - lineDisc) * (Number(li.taxPercent) || 0)) / 100;
                const lineTot = Math.max(0, lineSub - lineDisc) + lineTax;

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-border bg-surface/50 p-4 space-y-3"
                  >
                    <div className="grid gap-3 sm:grid-cols-6 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                          Item *
                        </label>
                        <select
                          value={li.itemId}
                          onChange={(e) => updateLineItem(index, "itemId", e.target.value)}
                          className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
                        >
                          {items.map((it) => (
                            <option key={it.id} value={it.id}>
                              {it.name} ({it.sku})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                          Qty *
                        </label>
                        <input
                          type="number"
                          min={1}
                          required
                          value={li.quantity}
                          onChange={(e) =>
                            updateLineItem(index, "quantity", Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                          Unit Cost (₹) *
                        </label>
                        <input
                          type="number"
                          min={0}
                          required
                          value={li.unitCost}
                          onChange={(e) =>
                            updateLineItem(index, "unitCost", Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                          Tax %
                        </label>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={li.taxPercent}
                          onChange={(e) =>
                            updateLineItem(index, "taxPercent", Number(e.target.value))
                          }
                          className="w-full rounded-xl border border-border bg-card px-2.5 py-1.5 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                        />
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-muted-foreground mb-1">
                            Line Total
                          </label>
                          <span className="font-mono font-bold text-xs text-foreground">
                            ₹{lineTot.toFixed(2)}
                          </span>
                        </div>
                        {lineItems.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeLineItem(index)}
                            className="h-7 px-2 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Totals Summary Ribbon */}
          <div className="grid gap-3 sm:grid-cols-4 pt-4 border-t border-border">
            <div className="rounded-2xl border border-border bg-surface p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Subtotal</span>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                ₹{calculated.subtotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Discount</span>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                ₹{calculated.discountTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-surface p-3">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Tax Total</span>
              <p className="text-sm font-mono font-bold text-foreground mt-0.5">
                ₹{calculated.taxTotal.toLocaleString()}
              </p>
            </div>
            <div className="rounded-2xl border border-border bg-primary/10 p-3">
              <span className="text-[10px] text-primary uppercase font-bold">Grand Total Payable</span>
              <p className="text-lg font-mono font-black text-primary mt-0.5">
                ₹{calculated.grandTotal.toLocaleString()}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Purchase Terms & Payment Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Delivery required within 7 days. Quality inspection upon arrival."
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/inventory/purchase-orders">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting || lineItems.length === 0}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Creating PO..." : "Save Purchase Order"}
          </Button>
        </div>
      </form>
    </div>
  );
};
