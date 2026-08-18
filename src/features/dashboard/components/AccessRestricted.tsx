import React from "react";
import { Link } from "@tanstack/react-router";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export const AccessRestricted: React.FC = () => {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center p-6">
      <div className="grid size-14 place-items-center rounded-3xl bg-destructive/10 text-destructive shadow-soft">
        <ShieldAlert className="size-7" />
      </div>
      <h2 className="mt-4 text-xl font-extrabold tracking-tight">Access Restricted</h2>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">
        You do not have administrative privileges to view the school administrator dashboard.
        Role-specific portals will activate in subsequent phases.
      </p>
      <Button variant="outline" size="sm" asChild className="mt-6 rounded-xl text-xs">
        <Link to="/profile">
          <ArrowLeft className="size-3.5 mr-1.5" /> View My Profile
        </Link>
      </Button>
    </div>
  );
};
