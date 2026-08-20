import React, { useState, useEffect } from "react";
import {
  Settings,
  MapPin,
  Plus,
  Save,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getInventorySettings,
  updateInventorySettings,
  listLocations,
  createLocation,
  updateLocation,
} from "@/services/inventoryService";
import type {
  InventorySettingsConfig,
  InventoryLocation,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const InventorySettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<InventorySettingsConfig | null>(null);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Settings form state
  const [assetPrefix, setAssetPrefix] = useState("INS-AST");
  const [poPrefix, setPoPrefix] = useState("INS-PO");
  const [enableLowStockAlerts, setEnableLowStockAlerts] = useState(true);
  const [enableDepreciation, setEnableDepreciation] = useState(false);
  const [depreciationMethod, setDepreciationMethod] = useState<"Straight Line" | "Written Down Value" | "None">("None");
  const [depreciationRatePercent, setDepreciationRatePercent] = useState<number>(10);
  const [units, setUnits] = useState<string[]>(["Piece", "Box", "Pack", "Kg", "Liter", "Meter", "Set"]);
  const [newUnit, setNewUnit] = useState("");

  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Location Modal State
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locName, setLocName] = useState("");
  const [locCode, setLocCode] = useState("");
  const [locType, setLocType] = useState<"Campus" | "Building" | "Floor" | "Room" | "Lab" | "Office" | "Store" | "Other">("Room");
  const [locDescription, setLocDescription] = useState("");
  const [isSavingLocation, setIsSavingLocation] = useState(false);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [st, locs] = await Promise.all([
        getInventorySettings(organization.id),
        listLocations(organization.id),
      ]);
      setSettings(st);
      setLocations(locs);
      setAssetPrefix(st.assetPrefix || "INS-AST");
      setPoPrefix(st.poPrefix || "INS-PO");
      setEnableLowStockAlerts(st.enableLowStockAlerts);
      setEnableDepreciation(st.enableDepreciation);
      setDepreciationMethod(st.depreciationMethod || "None");
      setDepreciationRatePercent(st.depreciationRatePercent || 10);
      if (st.defaultUnits && st.defaultUnits.length > 0) {
        setUnits(st.defaultUnits);
      }
    } catch (err: any) {
      console.error("loadSettings error:", err);
      setError(err.message || "Failed to load inventory configuration.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !settings) return;

    setIsSavingSettings(true);
    setSaveSuccess(false);
    try {
      await updateInventorySettings(
        organization.id,
        {
          autoGenerateAssetCode: settings.autoGenerateAssetCode,
          assetPrefix: assetPrefix.trim().toUpperCase(),
          nextAssetSeq: settings.nextAssetSeq,
          autoGeneratePoNumber: settings.autoGeneratePoNumber,
          poPrefix: poPrefix.trim().toUpperCase(),
          nextPoSeq: settings.nextPoSeq,
          enableLowStockAlerts,
          lowStockBufferPercentage: settings.lowStockBufferPercentage || 10,
          enableDepreciation,
          depreciationMethod,
          depreciationRatePercent: Number(depreciationRatePercent) || 0,
          defaultUnits: units,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleAddUnit = () => {
    if (!newUnit.trim()) return;
    if (units.includes(newUnit.trim())) {
      alert("This unit already exists.");
      return;
    }
    setUnits([...units, newUnit.trim()]);
    setNewUnit("");
  };

  const handleRemoveUnit = (unitToRemove: string) => {
    if (units.length <= 1) {
      alert("At least one unit of measure is required.");
      return;
    }
    setUnits(units.filter((u) => u !== unitToRemove));
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    if (!locName.trim()) {
      alert("Location name is required.");
      return;
    }

    setIsSavingLocation(true);
    try {
      await createLocation(
        organization.id,
        {
          name: locName.trim(),
          code: locCode.trim() || null,
          type: locType,
          description: locDescription.trim() || null,
          status: "Active",
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );
      setShowLocationModal(false);
      setLocName("");
      setLocCode("");
      setLocDescription("");
      const updatedLocs = await listLocations(organization.id);
      setLocations(updatedLocs);
    } catch (err: any) {
      alert("Failed to create location: " + err.message);
    } finally {
      setIsSavingLocation(false);
    }
  };

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Inventory & Asset Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure numbering sequences, physical campus storage locations, units, and depreciation rules.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {saveSuccess && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs text-emerald-600 flex items-center gap-2">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>Inventory settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Numbering & Identifiers */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Automatic Numbering Sequences
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Asset Barcode Code Prefix
              </label>
              <input
                type="text"
                required
                value={assetPrefix}
                onChange={(e) => setAssetPrefix(e.target.value)}
                placeholder="e.g. INS-AST"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                Preview: {assetPrefix}-2026-000001
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Purchase Order Prefix
              </label>
              <input
                type="text"
                required
                value={poPrefix}
                onChange={(e) => setPoPrefix(e.target.value)}
                placeholder="e.g. INS-PO"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1 font-mono">
                Preview: {poPrefix}-2026-0001
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Units of Measure */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Configurable Units of Measure
          </h2>

          <div className="flex flex-wrap gap-2">
            {units.map((u) => (
              <span
                key={u}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-surface border border-border text-foreground"
              >
                {u}
                <button
                  type="button"
                  onClick={() => handleRemoveUnit(u)}
                  className="text-muted-foreground hover:text-destructive"
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2 max-w-sm pt-2">
            <input
              type="text"
              value={newUnit}
              onChange={(e) => setNewUnit(e.target.value)}
              placeholder="e.g. Bundle, Ream, Vial"
              className="w-full rounded-2xl border border-border bg-surface px-3 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddUnit}
              className="rounded-xl text-xs shrink-0"
            >
              <Plus className="size-3.5 mr-1" /> Add Unit
            </Button>
          </div>
        </div>

        {/* Section 3: Depreciation Rules */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-extrabold text-foreground border-b border-border pb-3">
            Asset Valuation & Depreciation
          </h2>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="deprToggle"
              checked={enableDepreciation}
              onChange={(e) => setEnableDepreciation(e.target.checked)}
              className="rounded border-border size-4 text-primary focus:ring-primary"
            />
            <label htmlFor="deprToggle" className="text-xs font-semibold text-foreground cursor-pointer">
              Enable Institutional Asset Depreciation Calculation
            </label>
          </div>

          {enableDepreciation && (
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Depreciation Accounting Method
                </label>
                <select
                  value={depreciationMethod}
                  onChange={(e) => setDepreciationMethod(e.target.value as any)}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  <option value="Straight Line">Straight Line (SLM)</option>
                  <option value="Written Down Value">Written Down Value (WDV)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Annual Depreciation Rate (%)
                </label>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={depreciationRatePercent}
                  onChange={(e) => setDepreciationRatePercent(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSavingSettings}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            <Save className="size-3.5 mr-1.5" />
            {isSavingSettings ? "Saving Settings..." : "Save Configuration"}
          </Button>
        </div>
      </form>

      {/* Storage Locations Manager */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Campus Storage Locations & Rooms</h2>
            <p className="text-xs text-muted-foreground">Configurable storage rooms, laboratories, and departmental stores</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowLocationModal(true)}
            className="rounded-xl text-xs h-8"
          >
            <Plus className="size-3.5 mr-1" /> Add Location
          </Button>
        </div>

        {locations.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No locations configured yet. Add your campus rooms or central store.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {locations.map((loc) => (
              <div
                key={loc.id}
                className="rounded-2xl border border-border bg-surface/50 p-3.5 space-y-1.5"
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-xs text-foreground">{loc.name}</h3>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold border bg-secondary">
                    {loc.type}
                  </span>
                </div>
                {loc.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{loc.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h3 className="text-base font-extrabold text-foreground">Add Campus Location</h3>

            <form onSubmit={handleSaveLocation} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Location / Room Name *
                </label>
                <input
                  type="text"
                  required
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  placeholder="e.g. Physics Laboratory 1 / Central Stationery Store"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Location Code
                  </label>
                  <input
                    type="text"
                    value={locCode}
                    onChange={(e) => setLocCode(e.target.value)}
                    placeholder="e.g. PHY-LAB-01"
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono uppercase text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Location Type *
                  </label>
                  <select
                    value={locType}
                    onChange={(e) => setLocType(e.target.value as any)}
                    className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="Room">Classroom / Room</option>
                    <option value="Lab">Laboratory</option>
                    <option value="Store">Central Store / Warehouse</option>
                    <option value="Building">Building / Block</option>
                    <option value="Floor">Floor</option>
                    <option value="Office">Faculty Office</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={locDescription}
                  onChange={(e) => setLocDescription(e.target.value)}
                  placeholder="e.g. Ground floor science wing, cabinet B"
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLocationModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  size="sm"
                  disabled={isSavingLocation}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSavingLocation ? "Saving..." : "Save Location"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
