import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingScreenProps {
  message?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = "Loading your workspace...",
}) => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-card border border-border p-2 shadow-soft">
          <img src="/logo.png" alt="InSuite" className="size-10 object-contain" />
        </div>
        <div className="space-y-1">
          <h2 className="font-display text-lg font-black tracking-tight text-foreground">
            InSuite
          </h2>
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            <p className="text-xs font-semibold text-muted-foreground">{message}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
