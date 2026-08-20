import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Mail, Plus, Search, Filter, AlertCircle, RefreshCw, Paperclip } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listCorrespondence } from "@/services/frontOfficeService";
import type { FrontOfficeCorrespondence } from "@/types/frontOffice";
import { Button } from "@/components/ui/button";

export const CorrespondenceListView: React.FC = () => {
  const { organization } = useAuth();
  const [items, setItems] = useState<FrontOfficeCorrespondence[]>([]);
  const [typeFilter, setTypeFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listCorrespondence(organization.id);
      const filtered = typeFilter ? list.filter((c) => c.type === typeFilter) : list;
      setItems(filtered);
    } catch (err: any) {
      console.error("loadCorrespondence error:", err);
      setError(err.message || "Failed to load correspondence.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
  }, [organization, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Postal & Dispatch Correspondence
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Track incoming/outgoing mail, couriers, official speed posts, parcels, and deliveries.
          </p>
        </div>

        <Link
          to="/front-office/correspondence/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Add Postal Entry
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {["", "Incoming Mail", "Outgoing Mail", "Courier", "Parcel", "Official Letter"].map(
          (t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
                typeFilter === t
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t ? t : "All Types"}
            </button>
          )
        )}
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
          <Button onClick={loadItems} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Mail className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No postal records found</h3>
          <p className="mt-1 text-xs text-muted-foreground">Logged incoming/outgoing letters and packages will appear here.</p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 text-muted-foreground font-bold text-[10px] uppercase">
                  <th className="py-3 px-4">Ref / Docket No</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">From / Sender</th>
                  <th className="py-3 px-4">To / Recipient</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-surface/30 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-primary">
                      {item.referenceNumber || "—"}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-secondary text-foreground border border-border">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-bold text-foreground">{item.sender}</td>
                    <td className="py-3 px-4 font-bold text-foreground">{item.recipient}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item.subject}</td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">{item.date}</td>

                    <td className="py-3 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
