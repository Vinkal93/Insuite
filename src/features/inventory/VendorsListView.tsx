import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Truck,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Phone,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listVendors } from "@/services/inventoryService";
import type { InventoryVendor } from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const VendorsListView: React.FC = () => {
  const { organization } = useAuth();
  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listVendors(organization.id);
      setVendors(data);
    } catch (err: any) {
      console.error("loadVendors error:", err);
      setError(err.message || "Failed to load vendors.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Suppliers & Vendors Directory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Procurement partners, equipment manufacturers, and service contractors.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/inventory/vendors/new">
            <Plus className="size-3.5 mr-1.5" /> Add Vendor
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : vendors.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <Truck className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No suppliers onboarded yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Register your institution's stationery, IT hardware, and chemical vendors.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/inventory/vendors/new">
              <Plus className="size-3.5 mr-1" /> Add Vendor
            </Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3 hover:border-primary/40 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-extrabold text-sm text-foreground">{v.name}</h3>
                  <p className="text-xs text-muted-foreground">{v.contactPerson || "Direct Supplier"}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                    v.status === "Active"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : "bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {v.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-muted-foreground">
                {v.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-primary shrink-0" />
                    <span className="truncate">{v.email}</span>
                  </div>
                )}
                {v.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3.5 text-primary shrink-0" />
                    <span>{v.phone}</span>
                  </div>
                )}
                {v.gstin && (
                  <div className="text-[10px] font-mono font-semibold text-foreground pt-1">
                    GSTIN: {v.gstin}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end border-t border-border pt-3">
                <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                  <Link to="/inventory/vendors/$vendorId" params={{ vendorId: v.id }}>
                    <Eye className="size-3.5 mr-1" /> View Dossier
                  </Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
