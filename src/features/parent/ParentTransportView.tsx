import React, { useState, useEffect } from "react";
import { Bus, MapPin, Phone, User, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import { listStudentAssignments } from "@/services/transportService";
import type { TransportAssignment } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const ParentTransportView: React.FC = () => {
  const { organization } = useAuth();
  const { selectedChild, children: kids } = useParent();

  const [assignment, setAssignment] = useState<TransportAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransport = async () => {
    if (!organization || !selectedChild) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listStudentAssignments(organization.id, {
        studentId: selectedChild.id,
        status: "Active",
      });
      setAssignment(list.length > 0 ? list[0] : null);
    } catch (err: any) {
      console.error("loadTransport error:", err);
      setError(err.message || "Failed to load transport details.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransport();
  }, [organization, selectedChild]);

  if (kids.length === 0) {
    return (
      <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
        <Bus className="size-12 text-muted-foreground mx-auto" />
        <h2 className="mt-4 text-base font-extrabold text-foreground">No Children Linked</h2>
        <p className="mt-1 text-xs text-muted-foreground">Please contact school administration.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          School Transport
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bus route allocation, pickup stop, and commute schedule for{" "}
          <span className="font-bold text-foreground">{selectedChild?.fullName}</span>
        </p>
      </div>

      {isLoading ? (
        <div className="h-64 rounded-3xl bg-card border border-border animate-pulse" />
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadTransport} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : !assignment ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft space-y-3">
          <Bus className="size-12 text-muted-foreground mx-auto" />
          <h3 className="text-base font-extrabold text-foreground">No Transport Assigned</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            This student is currently not enrolled in the school bus service. Contact the transport desk to register for a route.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Route Card */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Bus className="size-5" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-foreground">{assignment.routeName}</h3>
                <p className="text-[10px] text-muted-foreground">Active School Bus Route</p>
              </div>
            </div>

            <div className="bg-surface/50 p-4 rounded-2xl border border-border space-y-3 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-muted-foreground block">Assigned Stop</span>
                  <span className="font-extrabold text-foreground">{assignment.stopName}</span>
                </div>
              </div>

              <div className="flex justify-between pt-2 border-t border-border">
                <span className="text-muted-foreground">Vehicle Number:</span>
                <span className="font-mono font-bold text-primary">{assignment.vehicleRegNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transport Fee:</span>
                <span className="font-bold text-foreground">₹{assignment.monthlyFee || 0} / month</span>
              </div>
            </div>
          </div>

          {/* Commute Guidelines */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-3">
            <h3 className="text-sm font-extrabold text-foreground">Commute Guidelines</h3>
            <ul className="text-xs text-muted-foreground space-y-2 list-disc list-inside">
              <li>Please ensure the student arrives at the pickup point 5 minutes before scheduled departure.</li>
              <li>Notify the transport supervisor in advance if the student is absent.</li>
              <li>Students must wear identity cards while commuting in school transport.</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
