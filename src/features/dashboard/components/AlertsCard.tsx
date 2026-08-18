import React from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, Info, ArrowRight } from "lucide-react";
import type { DashboardAlertItem } from "../types";
import { Button } from "@/components/ui/button";

interface AlertsCardProps {
  alerts: DashboardAlertItem[];
}

export const AlertsCard: React.FC<AlertsCardProps> = ({ alerts }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="size-4 text-primary" />
          <h3 className="text-sm font-extrabold text-foreground">Attention Required</h3>
        </div>
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {alerts.length} Items
        </span>
      </div>

      <div className="space-y-2.5">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex flex-col justify-between gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center ${
              alert.severity === "critical"
                ? "border-destructive/30 bg-destructive/5"
                : alert.severity === "warning"
                  ? "border-warning/30 bg-warning/5"
                  : "border-primary/20 bg-primary/5"
            }`}
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                {alert.severity === "warning" ? (
                  <AlertTriangle className="size-3.5 text-warning" />
                ) : (
                  <Info className="size-3.5 text-primary" />
                )}
                {alert.title}
              </p>
              <p className="text-[11px] text-muted-foreground">{alert.description}</p>
            </div>

            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold shrink-0">
              <Link to={alert.actionRoute}>
                {alert.actionLabel} <ArrowRight className="size-3 ml-1" />
              </Link>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};
