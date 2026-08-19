import React from "react";
import { Link } from "@tanstack/react-router";
import { Building2, Mail, Phone, MapPin, User, Settings, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const SchoolProfileCard: React.FC = () => {
  const { organization } = useAuth();

  return (
    <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
      <div className="flex items-center gap-3">
        {organization?.logoUrl ? (
          <img
            src={organization.logoUrl}
            alt={organization.name}
            className="size-12 rounded-2xl object-cover border border-border"
          />
        ) : (
          <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
            <Building2 className="size-6" />
          </div>
        )}
        <div className="truncate">
          <h2 className="text-sm font-extrabold text-foreground truncate">
            {organization?.name || "InSuite Academy"}
          </h2>
          <span className="inline-block rounded-md bg-secondary px-2 py-0.5 text-[10px] font-mono font-bold text-muted-foreground">
            Code: {organization?.code || "INS001"}
          </span>
        </div>
      </div>

      <div className="space-y-2 text-xs pt-1 border-t border-border">
        {organization?.principalName && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5" /> Principal:
            </span>
            <span className="font-semibold text-foreground">{organization.principalName}</span>
          </div>
        )}

        {organization?.email && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" /> Email:
            </span>
            <span className="font-semibold text-foreground truncate max-w-[160px]">
              {organization.email}
            </span>
          </div>
        )}

        {organization?.phone && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Phone className="size-3.5" /> Phone:
            </span>
            <span className="font-semibold text-foreground">{organization.phone}</span>
          </div>
        )}

        {organization?.city && (
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="size-3.5" /> Location:
            </span>
            <span className="font-semibold text-foreground">
              {organization.city}, {organization.state || organization.country || "India"}
            </span>
          </div>
        )}
      </div>

      <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs font-semibold">
        <Link to="/setup">
          <Settings className="size-3.5 mr-1" /> Manage School Profile
        </Link>
      </Button>
    </div>
  );
};
