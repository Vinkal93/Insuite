import React, { useState, useEffect, useCallback } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Phone,
  Mail,
  Briefcase,
  MapPin,
  GraduationCap,
  ArrowLeft,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getParent } from "@/services/parentService";
import { getStudent } from "@/services/studentService";
import type { Parent, Student } from "@/types";
import { Button } from "@/components/ui/button";

interface ParentProfileViewProps {
  parentId: string;
}

export const ParentProfileView: React.FC<ParentProfileViewProps> = ({ parentId }) => {
  const { organization } = useAuth();
  const [parent, setParent] = useState<Parent | null>(null);
  const [childrenList, setChildrenList] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const parentData = await getParent(organization.id, parentId);
      setParent(parentData);

      if (parentData && parentData.childrenIds?.length > 0) {
        const studentPromises = parentData.childrenIds.map((cId) =>
          getStudent(organization.id, cId)
        );
        const results = await Promise.all(studentPromises);
        setChildrenList(results.filter((s): s is Student => s !== null));
      }
    } catch (err) {
      console.error("Error loading parent profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [organization, parentId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex h-72 items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!parent) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center p-6">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="mt-3 text-lg font-bold">Guardian Record Not Found</h2>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/parents">Back to Parent Directory</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
            <Link to="/parents">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{parent.fullName}</h1>
            <p className="text-xs text-muted-foreground">
              Guardian Profile • {parent.relation}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left Column: Linked Children & Family Units */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <GraduationCap className="size-4 text-primary" />
                <h2 className="text-sm font-extrabold text-foreground">
                  Linked Children ({childrenList.length})
                </h2>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Family Cohort
              </span>
            </div>

            {childrenList.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                No active student records linked to this guardian.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {childrenList.map((student) => (
                  <div
                    key={student.id}
                    className="flex flex-col justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:border-primary/40 hover:shadow-soft"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-xl bg-card border border-border overflow-hidden flex items-center justify-center shrink-0">
                        {student.photoUrl ? (
                          <img src={student.photoUrl} alt="" className="size-full object-cover" />
                        ) : (
                          <span className="font-bold text-xs text-muted-foreground">
                            {student.firstName[0]}{student.lastName[0]}
                          </span>
                        )}
                      </div>
                      <div className="truncate">
                        <p className="font-bold text-sm text-foreground truncate">{student.fullName}</p>
                        <p className="font-mono text-xs font-semibold text-primary">{student.studentId}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {student.academic.className} ({student.academic.sectionName || "Sec A"})
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[9px] font-bold text-success">
                        {student.status}
                      </span>
                      <Button variant="ghost" size="sm" asChild className="h-7 text-xs text-primary font-bold">
                        <Link to="/students/$studentId" params={{ studentId: student.id }}>
                          View Profile <ExternalLink className="size-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact & Metadata Card */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px] border-b border-border pb-2">
              Guardian Details
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5">
                <Phone className="size-4 text-primary shrink-0" />
                <div>
                  <p className="font-semibold text-foreground font-mono">{parent.mobile}</p>
                  {parent.alternateMobile && (
                    <p className="text-[10px] text-muted-foreground font-mono">{parent.alternateMobile} (Alt)</p>
                  )}
                </div>
              </div>

              {parent.email && (
                <div className="flex items-center gap-2.5">
                  <Mail className="size-4 text-primary shrink-0" />
                  <p className="text-muted-foreground truncate">{parent.email}</p>
                </div>
              )}

              {parent.occupation && (
                <div className="flex items-center gap-2.5">
                  <Briefcase className="size-4 text-primary shrink-0" />
                  <p className="text-muted-foreground">{parent.occupation}</p>
                </div>
              )}

              {parent.address && (
                <div className="flex items-start gap-2.5 pt-2 border-t border-border/60">
                  <MapPin className="size-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-muted-foreground leading-relaxed">{parent.address}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
