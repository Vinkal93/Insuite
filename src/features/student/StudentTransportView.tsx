import React, { useState, useEffect } from "react";
import { Bus, MapPin, AlertCircle, RefreshCw } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { listStudentAssignments } from "@/services/transportService";
import type { TransportAssignment } from "@/types/transport";
import { Button } from "@/components/ui/button";

export const StudentTransportView: React.FC = () => {
  const { organization } = useAuth();
  const { student } = useStudent();

  const [assignment, setAssignment] = useState<TransportAssignment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTransport = async () => {
    if (!organization || !student) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const list = await listStudentAssignments(organization.id, {
        studentId: student.id,
        status: "Active",
      });
      setAssignment(list.length > 0 ? list[0] : null);
    } catch (err: any) {
      console.error("loadStudentTransport error:", err);
      setError(err.message || "Failed to load transport allocation.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTransport();
  }, [organization, student]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          School Transport
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bus route allocation and designated pickup/drop stop details.
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
            You are not currently registered for the school transport bus service.
          </p>
        </div>
      ) : (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 max-w-xl">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Bus className="size-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-foreground">{assignment.routeName}</h3>
              <p className="text-[10px] text-muted-foreground font-mono">
                Vehicle: {assignment.vehicleRegNo}
              </p>
            </div>
          </div>

          <div className="bg-surface/50 p-4 rounded-2xl border border-border space-y-3 text-xs">
            <div className="flex items-start gap-2.5">
              <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
              <div>
                <span className="text-[10px] text-muted-foreground block">Your Stop</span>
                <span className="font-extrabold text-foreground">{assignment.stopName}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
