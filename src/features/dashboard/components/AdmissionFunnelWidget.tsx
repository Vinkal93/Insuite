import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, UserPlus } from "lucide-react";
import type { AdmissionsFunnelData } from "../types";
import { Button } from "@/components/ui/button";

export const AdmissionFunnelWidget: React.FC<{
  data: AdmissionsFunnelData | null;
  isLoading: boolean;
}> = ({ data, isLoading }) => {
  const stages = [
    { label: "Enquiries", count: data?.enquiries ?? 0, color: "bg-blue-300 dark:bg-blue-950", textColor: "text-blue-500", route: "/admissions/enquiries" },
    { label: "Contacted", count: data?.contacted ?? 0, color: "bg-blue-400 dark:bg-blue-900", textColor: "text-blue-600", route: "/admissions/follow-ups" },
    { label: "Counselling", count: data?.counselling ?? 0, color: "bg-blue-500 dark:bg-blue-800", textColor: "text-blue-600", route: "/admissions/counselling" },
    { label: "Applications", count: data?.applications ?? 0, color: "bg-indigo-500 dark:bg-indigo-700", textColor: "text-indigo-600", route: "/admissions/applications" },
    { label: "Under Review", count: data?.underReview ?? 0, color: "bg-indigo-600 dark:bg-indigo-800", textColor: "text-indigo-600", route: "/admissions/applications" },
    { label: "Approved", count: data?.approved ?? 0, color: "bg-indigo-700 dark:bg-indigo-900", textColor: "text-indigo-700", route: "/admissions/applications" },
    { label: "Admitted", count: data?.admitted ?? 0, color: "bg-indigo-900 dark:bg-indigo-950", textColor: "text-indigo-900 dark:text-indigo-300", route: "/admissions/list" },
  ];

  const total = data?.enquiries || 1;

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Admissions Funnel</h2>
          <p className="text-xs text-muted-foreground">Prospective lead progression</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
          <Link to="/admissions/list">
            View All <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="space-y-2 pt-1">
        {stages.map((st, i) => {
          const widthPercent = Math.max(12, Math.min(100, Math.round(((st.count || 0) / (total || 1)) * 100)));
          return (
            <Link
              key={i}
              to={st.route}
              className="group flex items-center justify-between gap-3 rounded-xl p-1.5 hover:bg-secondary/40 transition-colors"
            >
              <span className="text-xs font-semibold text-muted-foreground w-24 truncate">
                {st.label}
              </span>
              <div className="h-4 flex-1 rounded-md bg-surface overflow-hidden">
                <div
                  className={`h-full rounded-md ${st.color} transition-all`}
                  style={{ width: `${widthPercent}%` }}
                />
              </div>
              <span className="w-8 text-right font-mono text-xs font-bold text-foreground">
                {st.count}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
