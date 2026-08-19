import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  Calendar,
  ArrowLeft,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Archive,
  Layers,
  BookOpen,
  Plus,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAcademicSessionById,
  getSchoolClasses,
  getSections,
  setActiveAcademicSessionFull,
  archiveAcademicSession,
} from "@/services";
import type { AcademicSessionItem, SchoolClass, Section } from "@/types";
import { Button } from "@/components/ui/button";

interface AcademicSessionDetailViewProps {
  sessionId: string;
}

export const AcademicSessionDetailView: React.FC<AcademicSessionDetailViewProps> = ({
  sessionId,
}) => {
  const { organization, firebaseUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [session, setSession] = useState<AcademicSessionItem | null>(null);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [sess, classes, sections] = await Promise.all([
        getAcademicSessionById(organization.id, sessionId),
        getSchoolClasses(organization.id, sessionId),
        getSections(organization.id, undefined, sessionId),
      ]);
      setSession(sess);
      setClassesList(classes);
      setSectionsList(sections);
    } catch (err: any) {
      setError(err.message || "Failed to load session details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, sessionId]);

  const handleSetActive = async () => {
    if (!organization || !firebaseUser || !session) return;
    if (!confirm(`Set "${session.name}" as the active academic session?`)) return;
    setIsProcessing(true);
    try {
      await setActiveAcademicSessionFull(organization.id, session.id, firebaseUser.uid);
      setSuccessMsg(`Session "${session.name}" is now active.`);
      await loadData();
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || "Failed to set active");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleArchive = async () => {
    if (!organization || !firebaseUser || !session) return;
    if (!confirm(`Archive session "${session.name}"? Data will be preserved.`)) return;
    setIsProcessing(true);
    try {
      await archiveAcademicSession(organization.id, session.id, firebaseUser.uid);
      setSuccessMsg(`Session "${session.name}" archived.`);
      await loadData();
      await refreshUserData();
    } catch (err: any) {
      setError(err.message || "Failed to archive");
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-7 animate-spin text-primary" />
        <p className="mt-2 text-xs">Loading session information...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="mt-2 text-sm font-bold">Academic Session Not Found</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/academics/sessions">Back to Sessions</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/academics/sessions">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                Session {session.name}
              </h1>
              {session.isActive ? (
                <span className="rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-success">
                  Active Session
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-muted-foreground">
                  {session.status}
                </span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {session.startDate} to {session.endDate}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!session.isActive && session.status !== "archived" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleSetActive}
              disabled={isProcessing}
              className="rounded-xl text-xs font-bold text-primary"
            >
              Set as Active
            </Button>
          )}
          {session.status !== "archived" && !session.isActive && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isProcessing}
              className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
            >
              <Archive className="size-3.5 mr-1" /> Archive Session
            </Button>
          )}
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
            <Link to="/academics/classes/new">
              <Plus className="size-3.5 mr-1" /> Add Class to Session
            </Link>
          </Button>
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Classes</span>
          <p className="mt-2 text-2xl font-black text-foreground">{classesList.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</span>
          <p className="mt-2 text-2xl font-black text-foreground">{sectionsList.length}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Status</span>
          <p className="mt-2 text-lg font-black text-foreground capitalize">{session.status}</p>
        </div>
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Active Status</span>
          <p className="mt-2 text-lg font-black text-foreground">{session.isActive ? "Yes (Primary)" : "No"}</p>
        </div>
      </div>

      {/* Classes enrolled in this session */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-border">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
            Classes Configured for {session.name}
          </h2>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
            <Link to="/academics/classes/new">+ Create Class</Link>
          </Button>
        </div>

        {classesList.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <GraduationCap className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No classes configured for this session yet.</p>
            <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
              <Link to="/academics/classes/new">+ Add First Class</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {classesList.map((c) => (
              <Link
                key={c.id}
                to="/academics/classes/$classId"
                params={{ classId: c.id }}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:bg-secondary hover:border-primary/40"
              >
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-xl bg-card border border-border font-extrabold text-foreground text-sm">
                    {c.code}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-foreground">{c.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {c.sectionsCount || 1} Sections • {c.subjectsCount || 0} Subjects
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
