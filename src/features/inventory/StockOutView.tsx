import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import {
  PackageMinus,
  ArrowLeft,
  Save,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  stockOut,
  listItems,
  listLocations,
} from "@/services/inventoryService";
import { listStaff, listDepartments } from "@/services/hrService";
import type { InventoryItem, InventoryLocation } from "@/types/inventory";
import type { Staff, Department } from "@/types/hr";
import { Button } from "@/components/ui/button";

export const StockOutView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState<InventoryItem[]>([]);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<InventoryLocation[]>([]);
  const [isInitializing, setIsInitializing] = useState(true);

  // Form State
  const [itemId, setItemId] = useState("");
  const [quantity, setQuantity] = useState<number>(1);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [issuedTo, setIssuedTo] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [locationId, setLocationId] = useState("");
  const [notes, setNotes] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      if (!organization) return;
      try {
        const [itList, sList, dList, locList] = await Promise.all([
          listItems(organization.id),
          listStaff(organization.id, { status: "Active" }),
          listDepartments(organization.id),
          listLocations(organization.id),
        ]);
        setItems(itList.filter((i) => i.currentStock > 0));
        setStaffList(sList);
        setDepartments(dList);
        setLocations(locList);
        if (itList.filter((i) => i.currentStock > 0).length > 0) {
          setItemId(itList.filter((i) => i.currentStock > 0)[0].id);
        }
      } catch (err: any) {
        console.error("Init stock out error:", err);
      } finally {
        setIsInitializing(false);
      }
    };
    init();
  }, [organization]);

  const selectedItemObj = items.find((i) => i.id === itemId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setError(null);

    if (!itemId || quantity <= 0) {
      setError("Please select an item and enter a valid quantity.");
      return;
    }
    if (!purpose.trim()) {
      setError("Please enter the operational purpose of stock issuance.");
      return;
    }
    if (selectedItemObj && quantity > selectedItemObj.currentStock) {
      setError(`Cannot issue ${quantity} ${selectedItemObj.unit}. Available stock is only ${selectedItemObj.currentStock} ${selectedItemObj.unit}.`);
      return;
    }

    setIsSubmitting(true);
    try {
      await stockOut(
        organization.id,
        {
          itemId,
          quantity: Number(quantity),
          date,
          issuedTo: issuedTo || null,
          departmentId: departmentId || null,
          purpose: purpose.trim(),
          locationId: locationId || null,
          notes: notes.trim() || null,
        },
        { uid: firebaseUser.uid, name: userProfile?.name || "Admin" }
      );

      navigate({ to: "/inventory/items/$itemId", params: { itemId } });
    } catch (err: any) {
      console.error("stockOut error:", err);
      setError(err.message || "Failed to issue stock.");
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
              Issue Stock (Stock Out)
            </h1>
            <p className="text-xs text-muted-foreground">
              Dispense consumable supplies, lab reagents, or stationery to departments or faculty.
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
            Issuance & Allocation Details
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Select Item to Issue *
              </label>
              {items.length === 0 ? (
                <p className="text-xs text-destructive">
                  No stock available to issue. All items are out of stock.
                </p>
              ) : (
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} ({i.sku}) — Available: {i.currentStock} {i.unit}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Quantity to Issue *
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={selectedItemObj?.currentStock || 9999}
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-2xl border border-border bg-surface px-3 py-2 font-mono font-bold text-xs text-foreground focus:border-primary focus:outline-none"
                />
                {selectedItemObj && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                    Max: {selectedItemObj.currentStock} {selectedItemObj.unit}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Issue Date *
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
                Issued To (Faculty / Staff)
              </label>
              <select
                value={issuedTo}
                onChange={(e) => setIssuedTo(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">General Requisition</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.fullName}>
                    {s.fullName} ({s.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Receiving Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">None / Administrative</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Operational Purpose *
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="e.g. Mid-term Exam Paper printing / Chemistry practical experiment"
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-foreground mb-1">
                Dispatched From Location
              </label>
              <select
                value={locationId}
                onChange={(e) => setLocationId(e.target.value)}
                className="w-full rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">Default Central Store</option>
                {locations.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} ({l.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-foreground mb-1">Notes</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved by Head of Science Department"
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
            disabled={isSubmitting || items.length === 0}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? "Dispensing..." : "Confirm Stock Issue"}
          </Button>
        </div>
      </form>
    </div>
  );
};
