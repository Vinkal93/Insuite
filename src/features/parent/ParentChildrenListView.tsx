import React from "react";
import { Link } from "@tanstack/react-router";
import { Users, GraduationCap, ArrowRight, UserCheck, CalendarCheck } from "lucide-react";
import { useParent } from "@/context/ParentContext";
import { Button } from "@/components/ui/button";

export const ParentChildrenListView: React.FC = () => {
  const { children: kids, setSelectedChildId, selectedChildId } = useParent();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          My Children
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Student academic dossiers and school enrolment profiles linked to your family account.
        </p>
      </div>

      {kids.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center shadow-soft">
          <Users className="size-12 text-muted-foreground mx-auto" />
          <h2 className="mt-4 text-base font-extrabold text-foreground">No Children Linked</h2>
          <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
            No children records are connected to your parent account.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {kids.map((kid) => {
            const isSelected = kid.id === selectedChildId;
            return (
              <div
                key={kid.id}
                className={`rounded-3xl border bg-card p-6 shadow-soft space-y-4 transition-all ${
                  isSelected ? "border-primary ring-2 ring-primary/20" : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-2xl bg-primary/10 text-primary font-black text-lg flex items-center justify-center border border-primary/20 overflow-hidden shrink-0">
                    {kid.photoUrl ? (
                      <img src={kid.photoUrl} alt={kid.fullName} className="w-full h-full object-cover" />
                    ) : (
                      kid.firstName.charAt(0)
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">{kid.fullName}</h3>
                    <p className="text-xs font-bold text-primary">
                      Class: {kid.academic.className} ({kid.academic.sectionName})
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Adm #: {kid.admissionNumber}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-surface/50 p-3 rounded-2xl border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Roll Number</span>
                    <span className="font-mono font-bold text-foreground">
                      {kid.academic.rollNumber || "—"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Session</span>
                    <span className="font-bold text-foreground truncate">
                      {kid.academic.sessionName || "Active"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={() => setSelectedChildId(kid.id)}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                      isSelected
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-surface border border-border text-foreground hover:bg-secondary"
                    }`}
                  >
                    {isSelected ? "Active Child ✓" : "Set Active"}
                  </button>

                  <Link
                    to={`/parent/children/${kid.id}`}
                    className="p-2 rounded-xl bg-card border border-border hover:border-primary text-foreground transition-colors"
                    title="View Child Profile"
                  >
                    <ArrowRight className="size-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
