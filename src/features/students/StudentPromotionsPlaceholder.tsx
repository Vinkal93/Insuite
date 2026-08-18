import React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const StudentPromotionsPlaceholder: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="grid size-14 place-items-center rounded-3xl bg-primary/10 text-primary shadow-soft">
        <ArrowUpRight className="size-7" />
      </div>
      <h2 className="mt-4 text-xl font-extrabold tracking-tight">Student Academic Promotions</h2>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
        Bulk class progression, section retention, and academic rollover workflows will unlock in the Academic Progression phase.
      </p>
      <Button variant="outline" size="sm" asChild className="mt-6 rounded-xl text-xs">
        <Link to="/students">
          <ArrowLeft className="size-3.5 mr-1.5" /> Back to All Students
        </Link>
      </Button>
    </div>
  );
};
