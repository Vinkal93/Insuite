import React from "react";
import {
  Users,
  GraduationCap,
  CalendarCheck,
  Wallet,
  CreditCard,
  UserPlus,
  Layers,
  Grid,
  TrendingUp,
} from "lucide-react";
import type { DashboardMetrics } from "../types";
import { Skeleton } from "@/components/ui/skeleton";

interface KeyMetricsSectionProps {
  metrics: DashboardMetrics | null;
  isLoading: boolean;
}

export const KeyMetricsSection: React.FC<KeyMetricsSectionProps> = ({ metrics, isLoading }) => {
  if (isLoading || !metrics) {
    return (
      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card p-4 space-y-3 shadow-soft">
            <div className="flex items-center justify-between">
              <Skeleton className="size-8 rounded-xl" />
              <Skeleton className="h-4 w-12 rounded" />
            </div>
            <Skeleton className="h-7 w-24 rounded-md" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      data: metrics.totalStudents,
      icon: Users,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-950/40",
    },
    {
      data: metrics.totalTeachers,
      icon: GraduationCap,
      color: "text-indigo-600 dark:text-indigo-400",
      bg: "bg-indigo-50 dark:bg-indigo-950/40",
    },
    {
      data: metrics.todayAttendance,
      icon: CalendarCheck,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-50 dark:bg-emerald-950/40",
    },
    {
      data: metrics.todayCollection,
      icon: Wallet,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-50 dark:bg-amber-950/40",
    },
    {
      data: metrics.pendingFees,
      icon: CreditCard,
      color: "text-rose-600 dark:text-rose-400",
      bg: "bg-rose-50 dark:bg-rose-950/40",
    },
    {
      data: metrics.newAdmissions,
      icon: UserPlus,
      color: "text-violet-600 dark:text-violet-400",
      bg: "bg-violet-50 dark:bg-violet-950/40",
    },
    {
      data: metrics.activeClasses,
      icon: Layers,
      color: "text-cyan-600 dark:text-cyan-400",
      bg: "bg-cyan-50 dark:bg-cyan-950/40",
    },
    {
      data: metrics.activeSections,
      icon: Grid,
      color: "text-teal-600 dark:text-teal-400",
      bg: "bg-teal-50 dark:bg-teal-950/40",
    },
  ];

  return (
    <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ data, icon: Icon, color, bg }) => (
        <div
          key={data.id}
          className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:border-primary/30 hover:shadow-lift"
        >
          <div className="flex items-center justify-between">
            <span className={`grid size-9 place-items-center rounded-xl ${bg} ${color}`}>
              <Icon className="size-4.5" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {data.title}
            </span>
          </div>

          <div className="mt-3">
            <p className="font-display text-2xl font-extrabold tracking-tight text-foreground">
              {data.value}
            </p>
            <p className="mt-1 text-[11px] font-medium text-muted-foreground truncate">
              {data.subtext}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
