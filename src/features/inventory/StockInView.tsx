import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  PackagePlus,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  stockIn,
  listItems,
  listVendors,
  listLocations,
} from "@/services/inventoryService";
import type { InventoryItem, InventoryVendor, InventoryLocation } from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const StockInView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [vendorId, setVendorId] = useState("");
  const [purchaseReference, setPurchaseReference] = useState("");
  const [unitCost, setUnitCost] = useState<number>(0);
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [itList, vList, locList] = await Promise.all([
          listItems(organization.id),
          listVendors(organization.id),
          listLocations(organization.id),
        ]);
        setItems(itList);
        setVendors(vList);
        setLocations(locList);
        if (itList.length > 0) {
          setItemId(itList[0].id);
          setUnitCost(itList[0].unitCost);
        }
      } catch (err: any) {
        console.error("Init stock in error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const handleItemChange = (selectedId: string) => {
    setItemId(selectedId);
    const it = items.find((i) => i.id === selectedId);
    if (it) {
      setUnitCost(it.unitCost);
      if (it.defaultLocationId) setLocationId(it.defaultLocationId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!itemId || quantity <= 0) {
      setError("Please select an item and enter a valid quantity greater than zero.");
      return;
    }

    setIsSubmitting(true);
    try {
      await stockIn(
        organization.id,
        {
          itemId,
          quantity: Number(quantity),
          date,
          vendorId: vendorId || null,
          purchaseReference: purchaseReference.trim() || null,
          unitCost: Number(unitCost) || 0,
          locationId: locationId || null,
          notes: notes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/inventory/items/$itemId", params: { itemId } });
    } catch (err: any) {
      console.error("stockIn error:", err);
      setError(err.message || "Failed to record stock inward.");
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  const selectedItemObj = items.find((i) => i.id === itemId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild className="rounded-xl h-8 px-2">
            <Link to="/inventory/items">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Record Stock Inward (Stock In)
            </h1>
            <p className="text-xs text-muted-foreground">
              Add newly purchased supplies or replenished stock into the institutional ledger.
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
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Inward Stock Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Select Inventory Item *
              </label>
              {items.length === 0 ? (
                <p className="text-xs text-destructive">
                  No inventory items found. Please create an inventory item first.
                </p>
              ) : (
                <select
                  value={itemId}
                  onChange={(e) => handleItemChange(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.sku}) — Current: {i.currentStock} {i.unit}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quantity Inward *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
                />
                {selectedItemObj && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    {selectedItemObj.unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Receipt Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Purchase Cost per Unit (₹)
              </label>
              <input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Total Transaction Cost (₹)
              </label>
              <div className="rounded-2xl border border-border bg-surface/50 px-3 py-2 font-mono font-bold text-xs text-emerald-600">
                ₹{(quantity * unitCost).toLocaleString()}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Supplying Vendor
              </label>
              <select
                value={vendorId}
                onChange={(e) => setVendorId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None / Open Market</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Invoice / PO Reference
              </label>
              <input
                type="text"
                value={purchaseReference}
                onChange={(e) => setPurchaseReference(e.target.value)}
                placeholder="e.g. INV-9921 / PO-2024-001"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Storage Destination
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Default Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">
              Inward Notes / Inspection Remarks
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Received in good packaging, batch verified"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/inventory/items">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Updating Ledger..." : "Confirm Stock In"}
          </Button>
        </div>
      </form>
    </div>
  );
};
