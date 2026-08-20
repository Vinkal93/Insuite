import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Plus, Users, Bed, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { listHostels } from "@/services/hostelService";
import type { Hostel } from "@/types/hostel";
import { Button } from "@/components/ui/button";

export const HostelsListView: React.FC = () => {
  const { organization } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHostels = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const list = await listHostels(organization.id);
      setHostels(list);
    } catch (err: any) {
      console.error("loadHostels error:", err);
      setError(err.message || "Failed to load hostels.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHostels();
  }, [organization]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Hostels & Boarding Houses
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Residential wings, gender configurations, total bed capacities, and designated wardens.
          </p>
        </div>

        <Link
          to="/hostel/hostels/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-primary text-primary-foreground text-xs font-bold shadow-sm hover:opacity-95 transition-opacity self-start sm:self-auto"
        >
          <Plus className="size-4" /> Add New Hostel
        </Link>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 rounded-3xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadHostels} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : hostels.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Building2 className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No hostels configured</h3>
          <p className="mt-1 text-xs text-muted-foreground">Add your first boarding hostel or student residence.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hostels.map((h) => (
            <div
              key={h.id}
              className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 hover:border-primary/40 transition-colors flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-8 rounded-xl bg-primary/10 text-primary font-black text-sm flex items-center justify-center">
                      {h.name.charAt(0)}
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">{h.name}</h3>
                      <span className="text-[10px] text-muted-foreground font-mono">Code: {h.code}</span>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      h.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {h.status}
                  </span>
                </div>

                <div className="bg-surface/50 p-3 rounded-2xl border border-border text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type:</span>
                    <span className="font-bold text-foreground">{h.type} Hostel</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Capacity:</span>
                    <span className="font-bold text-primary">{h.capacity} Beds</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Warden:</span>
                    <span className="font-semibold text-foreground">{h.wardenName || "Unassigned"}</span>
                  </div>
                </div>

                {h.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{h.description}</p>
                )}
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
                <Link
                  to="/hostel/rooms"
                  className="text-[11px] font-bold text-primary hover:underline"
                >
                  Manage Rooms →
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
