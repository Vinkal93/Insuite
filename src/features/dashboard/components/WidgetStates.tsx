import React from "react";
import { AlertCircle, RefreshCw, FolderOpen, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const WidgetSkeleton: React.FC<{ height?: string }> = ({ height = "h-40" }) => (
  <div className={`w-full ${height} animate-pulse rounded-3xl bg-surface/80 border border-border/50`} />
);

export const WidgetError: React.FC<{
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({ title = "Unable to load data", message = "A connection or permission error occurred.", onRetry }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center rounded-3xl border border-destructive/20 bg-destructive/5 text-destructive">
    <AlertCircle className="size-5 mb-1.5" />
    <h4 className="text-xs font-bold">{title}</h4>
    <p className="mt-0.5 text-[11px] text-muted-foreground max-w-xs">{message}</p>
    {onRetry && (
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="mt-3 rounded-xl text-xs font-semibold border-destructive/30 text-destructive hover:bg-destructive/10"
      >
        <RefreshCw className="size-3 mr-1" /> Retry
      </Button>
    )}
  </div>
);

export const WidgetEmpty: React.FC<{
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ title = "No records available", actionLabel, onAction }) => (
  <div className="flex flex-col items-center justify-center p-6 text-center text-muted-foreground">
    <FolderOpen className="size-6 opacity-40 mb-1.5" />
    <p className="text-xs font-semibold">{title}</p>
    {actionLabel && onAction && (
      <Button
        variant="outline"
        size="sm"
        onClick={onAction}
        className="mt-3 rounded-xl text-xs font-semibold"
      >
        {actionLabel}
      </Button>
    )}
  </div>
);
