import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  Boxes,
  ArrowLeft,
  Save,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  createAsset,
  listCategories,
  listLocations,
  listVendors,
} from "@/services/inventoryService";
import type { InventoryCategory, InventoryLocation, InventoryVendor, AssetCondition, AssetStatus } from "@/types/inventory";
import type { InventoryAssetInput } from "@/schemas/inventory";
import { Button } from "@/components/ui/button";

export const CreateAssetView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split("T")[0]);
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [warrantyExpiry, setWarrantyExpiry] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [condition, setCondition] = useState<AssetCondition>("Good");
  const [status, setStatus] = useState<AssetStatus>("Available");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [cats, locs, vens] = await Promise.all([
          listCategories(organization.id),
          listLocations(organization.id),
          listVendors(organization.id),
        ]);
        setCategories(cats);
        setLocations(locs);
        setVendors(vens);
        if (cats.length > 0) setCategoryId(cats[0].id);
      } catch (err: any) {
        console.error("Init asset form error:", err);
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

    if (!name.trim() || !categoryId) {
      setError("Asset Name and Category are required.");
      return;
    }

    const input: InventoryAssetInput = {
      name: name.trim(),
      categoryId,
      serialNumber: serialNumber.trim() || null,
      model: model.trim() || null,
      manufacturer: manufacturer.trim() || null,
      purchaseDate: purchaseDate || null,
      purchasePrice: purchasePrice !== undefined && purchasePrice !== null ? Number(purchasePrice) : null,
      warrantyExpiry: warrantyExpiry || null,
      vendorId: vendorId || null,
      locationId: locationId || null,
      condition,
      status,
    };

    setIsSubmitting(true);
    try {
      const created = await createAsset(organization.id, input, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });

      navigate({ to: "/inventory/assets/$assetId", params: { assetId: created.id } });
    } catch (err: any) {
      console.error("createAsset error:", err);
      setError(err.message || "Failed to register asset.");
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
            <Link to="/inventory/assets">
              <ArrowLeft className="size-4 mr-1" /> Back
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-black tracking-tight text-foreground sm:text-2xl">
              Register Fixed Asset
            </h1>
            <p className="text-xs text-muted-foreground">
              Onboard equipment, computers, lab gear, or institutional furniture.
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
        {/* Section A: Specifications */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Section A: Asset Specifications & Category
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Asset Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Dell OptiPlex 7090 Desktop"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Asset Category *
              </label>
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
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Serial Number / Service Tag
              </label>
              <input
                type="text"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                placeholder="e.g. SN-8921-X99"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Manufacturer / Brand
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Dell / HP / Godrej"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Model Number
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. OptiPlex 7090"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section B: Acquisition & Warranty */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Section B: Acquisition, Pricing & Warranty
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Purchase Date
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Purchase Price (₹)
              </label>
              <input
                type="number"
                min={0}
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(Number(e.target.value))}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Warranty Expiration Date
              </label>
              <input
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
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
                <option value="">None / Direct Purchase</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Physical Location / Room
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Unassigned Location</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Initial Physical Condition
              </label>
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="Brand New">Brand New</option>
                <option value="Good">Good</option>
                <option value="Fair">Fair</option>
                <option value="Needs Repair">Needs Repair</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/inventory/assets">Cancel</Link>
          </Button>
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Registering..." : "Save & Register Asset"}
          </Button>
        </div>
      </form>
    </div>
  );
};
