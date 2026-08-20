import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Package,
  ArrowLeft,
  Save,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createItem,
  listCategories,
  listLocations,
  getInventorySettings,
} from "@/services/inventoryService";
import type { InventoryCategory, InventoryLocation } from "@/types/inventory";
import type { InventoryItemInput } from "@/schemas/inventory";
import { Button } from "@/components/ui/button";

export const CreateInventoryItemView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [availableUnits, setAvailableUnits] = useState<string[]>(["Piece", "Box", "Pack", "Kg", "Liter", "Meter", "Set"]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form Fields
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [unit, setUnit] = useState("Piece");
  const [minimumStock, setMinimumStock] = useState<number>(0);
  const [reorderLevel, setReorderLevel] = useState<number>(5);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [defaultLocationId, setDefaultLocationId] = useState("");
  const [description, setDescription] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [cats, locs, settings] = await Promise.all([
          listCategories(organization.id),
          listLocations(organization.id),
          getInventorySettings(organization.id),
        ]);
        setCategories(cats);
        setLocations(locs);
        if (settings.defaultUnits && settings.defaultUnits.length > 0) {
          setAvailableUnits(settings.defaultUnits);
        }
        if (cats.length > 0) setCategoryId(cats[0].id);
      } catch (err: any) {
        console.error("Init item form error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!name.trim() || !sku.trim()) {
      setError("Item Name and SKU are required.");
      return;
    }
    if (!categoryId) {
      setError("Please select an item category.");
      return;
    }

    const input: InventoryItemInput = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      categoryId,
      unit,
      minimumStock: Number(minimumStock) || 0,
      reorderLevel: Number(reorderLevel) || 0,
      unitCost: Number(unitCost) || 0,
      defaultLocationId: defaultLocationId || null,
      description: description.trim() || null,
      status: "In Stock",
    };

    setIsSubmitting(true);
    try {
      const created = await createItem(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      navigate({ to: "/inventory/items/$itemId", params: { itemId: created.id } });
    } catch (err: any) {
      console.error("createItem error:", err);
      setError(err.message || "Failed to create inventory item.");
      setIsSubmitting(false);
    }
  };

  if (isInitializing) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

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
              Add Inventory Item
            </h1>
            <p className="text-xs text-muted-foreground">
              Define stock-tracked consumable or laboratory supplies.
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
            Item Profile & Identifiers
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. A4 Printer Paper 80GSM"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">SKU / Code *</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. STAT-A4-001"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Category *</label>
              {categories.length === 0 ? (
                <p className="text-xs text-destructive">
                  No categories found. Please create a category first.
                </p>
              ) : (
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.type})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Unit of Measure *</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                {availableUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">Default Storage Location</label>
              <select
                value={defaultLocationId}
                onChange={(e) => setDefaultLocationId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None (Unassigned)</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Thresholds & Pricing */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Stock Thresholds & Cost
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Minimum Stock Level
              </label>
              <input
                type="number"
                min={0}
                value={minimumStock}
                onChange={(e) => setMinimumStock(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Reorder Threshold Trigger
              </label>
              <input
                type="number"
                min={0}
                value={reorderLevel}
                onChange={(e) => setReorderLevel(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Standard Unit Cost (₹)
              </label>
              <input
                type="number"
                min={0}
                value={unitCost}
                onChange={(e) => setUnitCost(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. High grade printing paper for administrative and examination printouts"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
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
            {isSubmitting ? "Creating Item..." : "Save Item"}
          </Button>
        </div>
      </form>
    </div>
  );
};
