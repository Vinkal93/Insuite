import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeftRight,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Boxes,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listAssetTransfers } from "@/services/inventoryService";
import type { AssetTransfer } from "@/types/inventory";
import { Button } from "@/components/ui/button";

export const TransfersListView: React.FC = () => {
  const { organization } = useAuth();
  const [transfers, setTransfers] = useState<AssetTransfer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await listAssetTransfers(organization.id);
      setTransfers(data);
    } catch (err: any) {
      console.error("loadTransfers error:", err);
      setError(err.message || "Failed to load transfer logs.");
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
            Asset Transfers Ledger
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete audit trail of equipment handovers across campus buildings and faculty custodians.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/inventory/assets">
            <Boxes className="size-3.5 mr-1.5" /> View Asset Register
          </Link>
        </Button>
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
      ) : transfers.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <ArrowLeftRight className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No asset transfers logged yet</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Transfers between departments and rooms will be audited here automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Asset</th>
                <th className="py-3 px-4">From Location</th>
                <th className="py-3 px-4">To Location</th>
                <th className="py-3 px-4">From Custodian</th>
                <th className="py-3 px-4">To Custodian</th>
                <th className="py-3 px-4">Reason</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transfers.map((tr) => (
                <tr key={tr.id} className="hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-4 text-muted-foreground">{tr.transferDate}</td>
                  <td className="py-3 px-4 font-bold text-foreground">
                    {tr.assetName} <span className="font-mono text-primary font-normal">({tr.assetCode})</span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{tr.fromLocationName || "—"}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{tr.toLocationName || "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{tr.fromStaffName || "—"}</td>
                  <td className="py-3 px-4 font-semibold text-foreground">{tr.toStaffName || "—"}</td>
                  <td className="py-3 px-4 text-muted-foreground">{tr.reason}</td>
                  <td className="py-3 px-4 text-right">
                    <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                      <Link to="/inventory/assets/$assetId" params={{ assetId: tr.assetId }}>
                        <Eye className="size-3.5 mr-1" /> Asset
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
  );
};
