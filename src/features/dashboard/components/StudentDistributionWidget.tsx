import React from "react";
import { Link } from "@tanstack/react-router";
import { GraduationCap, ArrowRight, Plus } from "lucide-react";
import type { ClassDistributionItem } from "../types";
import { Button } from "@/components/ui/button";

export const StudentDistributionWidget: React.FC<{
  distribution: ClassDistributionItem[];
  isLoading: boolean;
}> = ({ distribution, isLoading }) => {
  const maxCount = Math.max(...distribution.map((d) => d.count), 1);

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Students by Class</h2>
          <p className="text-xs text-muted-foreground">Class-wise student enrollment load</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
          <Link to="/students">
            View All <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </div>

      {distribution.length === 0 ? (
        <div className="py-8 text-center space-y-3">
          <p className="text-xs text-muted-foreground">No classes configured yet.</p>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academics/classes/new">
              <Plus className="size-3.5 mr-1" /> Configure Classes
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5 pt-1">
          {distribution.slice(0, 8).map((item) => {
            const widthPercent = Math.max(8, Math.round((item.count / maxCount) * 100));
            return (
              <div key={item.classId} className="flex items-center justify-between gap-3 text-xs">
                <span className="w-20 font-semibold text-foreground truncate">{item.className}</span>
                <div className="h-2.5 flex-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${widthPercent}%` }}
                  />
                </div>
                <span className="w-8 text-right font-mono font-bold text-foreground">
                  {item.count}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
