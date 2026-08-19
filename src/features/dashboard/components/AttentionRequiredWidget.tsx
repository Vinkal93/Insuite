import React from "react";
import { Link } from "@tanstack/react-router";
import { AlertCircle, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import type { AttentionItem } from "../types";

export const AttentionRequiredWidget: React.FC<{
  items: AttentionItem[];
  isLoading: boolean;
}> = ({ items, isLoading }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-foreground">Attention Required</h2>
        <span className="text-[11px] font-bold text-muted-foreground uppercase">
          {items.length} Action{items.length !== 1 ? "s" : ""}
        </span>
      </div>

      {items.length === 0 ? (
        <div className="flex items-center gap-2.5 rounded-2xl bg-emerald-500/10 p-4 text-xs text-emerald-600">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>You're all caught up! No operational alerts require immediate intervention.</span>
        </div>
      ) : (
        <div className="space-y-2.5">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.actionRoute}
              className={`flex items-start justify-between gap-3 rounded-2xl border p-3.5 text-xs transition-colors hover:shadow-xs ${
                item.severity === "error"
                  ? "border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-700 dark:text-rose-400"
                  : item.severity === "warning"
                  ? "border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-700 dark:text-amber-400"
                  : "border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-blue-700 dark:text-blue-400"
              }`}
            >
              <div className="space-y-0.5">
                <p className="font-bold">{item.title}</p>
                <p className="text-[11px] opacity-80">{item.description}</p>
              </div>
              <span className="font-mono font-bold text-xs shrink-0 rounded-full px-2 py-0.5 bg-card">
                {item.count}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
