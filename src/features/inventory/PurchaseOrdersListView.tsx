import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  ShoppingCart,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listPurchaseOrders, listVendors } from "@/services/inventoryService";
import type { PurchaseOrder, InventoryVendor, PurchaseOrderStatus } from "@/types/inventory";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export const PurchaseOrdersListView: React.FC = () => {
  const { organization } = useAuth();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<InventoryVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [vendorFilter, setVendorFilter] = useState<string>("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [poList, vList] = await Promise.all([
        listPurchaseOrders(organization.id),
        listVendors(organization.id),
      ]);
      setPurchaseOrders(poList);
      setVendors(vList);
    } catch (err: any) {
      console.error("loadPurchaseOrders error:", err);
      setError(err.message || "Failed to load purchase orders.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      const matchesSearch =
        po.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        po.vendorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || po.status === statusFilter;
      const matchesVendor = vendorFilter === "ALL" || po.vendorId === vendorFilter;

      return matchesSearch && matchesStatus && matchesVendor;
    });
  }, [purchaseOrders, searchQuery, statusFilter, vendorFilter]);

  const totalPages = Math.ceil(filteredPOs.length / ITEMS_PER_PAGE) || 1;
  const paginatedPOs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPOs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPOs, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Purchase Orders & Procurement
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Procurement requisitions, approval lifecycle, and multi-item stock receiving.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/inventory/purchase-orders/new">
            <Plus className="size-3.5 mr-1.5" /> Create Purchase Order
          </Link>
        </Button>
      </div>

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-3 max-w-2xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search PO #, vendor..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="Submitted">Submitted</option>
            <option value="Approved">Approved</option>
            <option value="Ordered">Ordered</option>
            <option value="Partially Received">Partially Received</option>
            <option value="Received">Received (Completed)</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          <select
            value={vendorFilter}
            onChange={(e) => {
              setVendorFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Vendors</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
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
      ) : filteredPOs.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <ShoppingCart className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No purchase orders found</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Generate formal procurement purchase orders with multi-item line calculations.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/inventory/purchase-orders/new">
              <Plus className="size-3.5 mr-1" /> Create Purchase Order
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-3 px-4">PO Number</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Order Date</th>
                  <th className="py-3 px-4">Delivery Due</th>
                  <th className="py-3 px-4">Line Items</th>
                  <th className="py-3 px-4">Subtotal (₹)</th>
                  <th className="py-3 px-4">Total (₹)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedPOs.map((po) => (
                  <tr key={po.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">{po.poNumber}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{po.vendorName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{po.orderDate}</td>
                    <td className="py-3 px-4 text-muted-foreground">{po.expectedDelivery || "—"}</td>
                    <td className="py-3 px-4 text-muted-foreground">{po.items.length} items</td>
                    <td className="py-3 px-4 font-mono">₹{po.subtotal.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono font-bold text-foreground">
                      ₹{po.total.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
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
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                        <Link to="/inventory/purchase-orders/$orderId" params={{ orderId: po.id }}>
                          <Eye className="size-3.5 mr-1" /> View / Receive
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedPOs.map((po) => (
              <div
                key={po.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-sm text-foreground font-mono text-primary">
                      {po.poNumber}
                    </h3>
                    <p className="text-xs font-semibold text-foreground">{po.vendorName}</p>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      po.status === "Received"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {po.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface/50 p-2.5 rounded-2xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Date</span>
                    <span className="font-semibold text-foreground">{po.orderDate}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Amount</span>
                    <span className="font-bold text-foreground font-mono">
                      ₹{po.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/inventory/purchase-orders/$orderId" params={{ orderId: po.id }}>
                      View Details
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredPOs.length} purchase orders)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl text-xs h-8"
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl text-xs h-8"
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
