import React, { useState } from "react";
import {
  UserPlus,
  UserCheck,
  CalendarCheck,
  Wallet,
  FileCheck,
  MessageSquare,
  GraduationCap,
  FileBarChart,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export const QuickActionsGrid: React.FC = () => {
  const [activeAction, setActiveAction] = useState<string | null>(null);

  const actions = [
    { id: "add_student", label: "Add Student", icon: UserPlus, phase: "Phase 3" },
    { id: "new_admission", label: "New Admission", icon: UserCheck, phase: "Phase 4" },
    { id: "take_attendance", label: "Take Attendance", icon: CalendarCheck, phase: "Phase 6" },
    { id: "collect_fee", label: "Collect Fee", icon: Wallet, phase: "Phase 9" },
    { id: "create_exam", label: "Create Exam", icon: FileCheck, phase: "Phase 10" },
    { id: "send_notice", label: "Send Notice", icon: MessageSquare, phase: "Phase 13" },
    { id: "add_teacher", label: "Add Teacher", icon: GraduationCap, phase: "Phase 5" },
    { id: "generate_report", label: "Generate Report", icon: FileBarChart, phase: "Phase 16" },
  ];

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h3 className="text-sm font-extrabold text-foreground">Administrative Quick Actions</h3>
          <p className="text-xs text-muted-foreground">Direct shortcuts for daily operational tasks</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {actions.map((action) => (
          <button
            key={action.id}
            type="button"
            onClick={() => setActiveAction(`${action.label} (${action.phase})`)}
            className="group flex flex-col items-center justify-center rounded-2xl border border-border bg-surface p-3.5 text-center transition-all hover:border-primary/40 hover:bg-card hover:shadow-soft"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-card border border-border text-primary transition-all group-hover:bg-primary group-hover:text-primary-foreground">
              <action.icon className="size-5" />
            </span>
            <span className="mt-2.5 text-[11px] font-bold text-foreground leading-tight">
              {action.label}
            </span>
            <span className="mt-1 rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold text-muted-foreground">
              {action.phase}
            </span>
          </button>
        ))}
      </div>

      <Dialog open={!!activeAction} onOpenChange={(open) => !open && setActiveAction(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Info className="size-6" />
            </div>
            <DialogTitle className="text-center font-bold">{activeAction}</DialogTitle>
            <DialogDescription className="text-center text-xs leading-relaxed">
              This operational workflow is part of the modular rollout and will activate in its scheduled development phase.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 flex justify-center">
            <Button variant="hero" size="sm" onClick={() => setActiveAction(null)} className="rounded-xl">
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
