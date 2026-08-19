import React from "react";
import { Link } from "@tanstack/react-router";
import { FileText, Clock, CheckCircle2, ClipboardCheck, ArrowRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Dashboard2KPIs } from "../types";

export const AcademicWorkWidget: React.FC<{
  kpis: Dashboard2KPIs | null;
  isLoading: boolean;
}> = ({ kpis, isLoading }) => {
  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-extrabold text-foreground">Academic Work</h2>
          <p className="text-xs text-muted-foreground">Active assignments & grading tasks</p>
        </div>
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
          <Link to="/academic-work">
            View All <ArrowRight className="size-3 ml-1" />
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        <Link
          to="/academic-work/assignments"
          className="rounded-2xl border border-border bg-surface p-3 space-y-1 hover:border-primary transition-colors"
        >
          <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-bold uppercase">
            <FileText className="size-3 text-primary" /> Active Tasks
          </div>
          <p className="text-xl font-black text-foreground">{kpis?.assignments.value ?? 0}</p>
        </Link>

        <Link
          to="/academic-work/grading"
          className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-1 hover:border-amber-500 transition-colors"
        >
          <div className="flex items-center gap-1.5 text-amber-600 text-[10px] font-bold uppercase">
            <CheckCircle2 className="size-3 text-amber-500" /> Needs Grading
          </div>
          <p className="text-xl font-black text-amber-600">{kpis?.assignments.needsGrading ?? 0}</p>
        </Link>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold">
          <Link to="/academic-work/assignments/new">
            <Plus className="size-3.5 mr-1" /> Create Assignment
          </Link>
        </Button>
      </div>
    </div>
  );
};
