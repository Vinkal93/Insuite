import React from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Mail, Phone, MapPin, Edit3 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const SchoolProfileCard: React.FC = () => {
  const { organization } = useAuth();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <h3 className="text-sm font-extrabold text-foreground">Institution Information</h3>
        <Button variant="ghost" size="sm" asChild className="h-7 rounded-lg text-xs text-primary">
          <Link to="/settings">
            <Edit3 className="size-3 mr-1" /> Edit School
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3.5">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-surface border border-border p-1.5 shadow-sm shrink-0">
          <img
            src={organization?.logoUrl || "/logo.png"}
            alt="School Crest"
            className="size-full object-contain"
          />
        </div>
        <div className="truncate">
          <h4 className="font-display text-base font-extrabold text-foreground truncate">
            {organization?.name || "InSuite Academy"}
          </h4>
          <p className="font-mono text-xs font-bold text-primary">
            Code: {organization?.code || "SCH-001"}
          </p>
        </div>
      </div>

      <div className="grid gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        {organization?.principalName && (
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground">Principal:</span> {organization.principalName}
          </div>
        )}
        {organization?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="size-3.5 text-primary shrink-0" /> {organization.phone}
          </div>
        )}
        {organization?.email && (
          <div className="flex items-center gap-2 truncate">
            <Mail className="size-3.5 text-primary shrink-0" /> {organization.email}
          </div>
        )}
        {(organization?.city || organization?.state) && (
          <div className="flex items-center gap-2">
            <MapPin className="size-3.5 text-primary shrink-0" /> {organization.city}, {organization.state}
          </div>
        )}
      </div>
    </div>
  );
};
