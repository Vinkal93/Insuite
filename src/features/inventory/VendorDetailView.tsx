import React, { useState, useEffect } from "react";
import { useParams, Link } from "@tanstack/react-router";
import {
  Truck,
  ArrowLeft,
  ShoppingCart,
  Boxes,
  Mail,
  Phone,
  Globe,
  MapPin,
  AlertCircle,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getVendor,
  listPurchaseOrders,
  listAssets,
} from "@/services/inventoryService";
import type {
  InventoryVendor,
  PurchaseOrder,
  InventoryAsset,
} from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const VendorDetailView: React.FC = () => {
  const { vendorId } = useParams({ from: "/inventory/vendors/$vendorId" });
  const { organization } = useAuth();

  const [vendor, setVendor] = useState<InventoryVendor | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliedAssets, setSuppliedAssets] = useState<InventoryAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!organization || !vendorId) return;
      setIsLoading(true);
      setError(null);
      try {
        const [v, pos, asts] = await Promise.all([
          getVendor(organization.id, vendorId),
          listPurchaseOrders(organization.id, { vendorId }),
          listAssets(organization.id),
        ]);
        setVendor(v);
        setPurchaseOrders(pos);
        setSuppliedAssets(asts.filter((a) => a.vendorId === vendorId));
      } catch (err: any) {
        console.error("Vendor detail load error:", err);
        setError(err.message || "Failed to load vendor details.");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [organization, vendorId]);

  if (isLoading) {
    return <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />;
  }

  if (error || !vendor) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-10 text-destructive mx-auto" />
        <h2 className="mt-3 text-base font-bold text-foreground">Vendor Not Found</h2>
        <p className="mt-1 text-xs text-muted-foreground">{error || "The vendor profile does not exist."}</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/inventory/vendors">
            <ArrowLeft className="size-3.5 mr-1" /> Return to Vendors
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
              <Truck className="size-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-black text-foreground">{vendor.name}</h1>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                    vendor.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {vendor.status}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                Contact: {vendor.contactPerson || "Direct Supplier"} • GSTIN:{" "}
                <span className="font-mono font-bold text-foreground">
                  {vendor.gstin || "Unregistered"}
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
              <Link to="/inventory/purchase-orders/new">
                <Plus className="size-3.5 mr-1" /> New Purchase Order
              </Link>
            </Button>
          </div>
        </div>

        {/* Contact Strip */}
        <div className="grid gap-3 sm:grid-cols-3 pt-2 border-t border-border text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Mail className="size-4 text-primary shrink-0" />
            <span className="truncate">{vendor.email || "No email on file"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Phone className="size-4 text-primary shrink-0" />
            <span>{vendor.phone || "No phone on file"}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="size-4 text-primary shrink-0" />
            <span className="truncate">{vendor.address || "No address on file"}</span>
          </div>
        </div>
      </div>

      {/* Linked Purchase Orders */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Purchase Orders & Invoices</h2>
            <p className="text-xs text-muted-foreground">Historical procurement orders issued to this vendor</p>
          </div>
        </div>

        {purchaseOrders.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No purchase orders issued to this vendor yet.
          </p>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-2.5 px-4">PO Number</th>
                  <th className="py-2.5 px-4">Order Date</th>
                  <th className="py-2.5 px-4">Line Items</th>
                  <th className="py-2.5 px-4">Total Amount (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {purchaseOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-surface/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-primary">{po.poNumber}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{po.orderDate}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{po.items.length} items</td>
                    <td className="py-2.5 px-4 font-mono font-bold text-foreground">
                      ₹{po.total.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border bg-secondary">
                        {po.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-xs">
                        <Link to="/inventory/purchase-orders/$orderId" params={{ orderId: po.id }}>
                          View PO
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Supplied Assets */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-sm font-extrabold text-foreground">Supplied Fixed Assets</h2>
            <p className="text-xs text-muted-foreground">Capital equipment procured from this supplier</p>
          </div>
        </div>

        {suppliedAssets.length === 0 ? (
          <p className="text-xs text-muted-foreground italic py-6 text-center">
            No fixed assets registered under this vendor.
          </p>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-2.5 px-4">Asset Code</th>
                  <th className="py-2.5 px-4">Asset Name</th>
                  <th className="py-2.5 px-4">Purchase Date</th>
                  <th className="py-2.5 px-4">Price (₹)</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {suppliedAssets.map((a) => (
                  <tr key={a.id} className="hover:bg-surface/50">
                    <td className="py-2.5 px-4 font-mono font-bold text-primary">{a.assetCode}</td>
                    <td className="py-2.5 px-4 font-bold text-foreground">{a.name}</td>
                    <td className="py-2.5 px-4 text-muted-foreground">{a.purchaseDate || "—"}</td>
                    <td className="py-2.5 px-4 font-mono font-semibold text-foreground">
                      {a.purchasePrice ? `₹${a.purchasePrice.toLocaleString()}` : "—"}
                    </td>
                    <td className="py-2.5 px-4 font-semibold">{a.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
