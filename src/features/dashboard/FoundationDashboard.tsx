import React from "react";
import { Link } from "@tanstack/react-router";
import {
  Building2,
  Calendar,
  Layers,
  BookOpen,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

export const FoundationDashboard: React.FC = () => {
  const { userProfile, organization, activeSession } = useAuth();

  return (
    <div className="space-y-6">
      {/* Welcome Card */}
      <div className="bg-gradient-ink relative overflow-hidden rounded-3xl p-6 text-ink-foreground shadow-lift sm:p-8">
        <div
          className="pointer-events-none absolute -right-20 -top-20 size-72 rounded-full blur-3xl opacity-30"
          style={{ background: "var(--gradient-brand)" }}
        />
        <div className="relative flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-ink-foreground/90">
              <Sparkles className="size-3.5 text-primary" />
              Phase 1 Core Foundation Active
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
              Welcome to InSuite, {userProfile?.displayName || "Admin"}!
            </h1>
            <p className="text-xs leading-relaxed text-ink-foreground/75 sm:text-sm">
              Managing <strong className="text-white">{organization?.name || "Your School"}</strong>
              {organization?.code && ` (${organization.code})`}
            </p>
          </div>

          {activeSession && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left sm:text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-ink-foreground/60">
                Active Academic Session
              </p>
              <p className="mt-1 font-display text-xl font-extrabold text-white">
                {activeSession.name}
              </p>
              <p className="text-[10px] text-ink-foreground/60">
                {activeSession.startDate} to {activeSession.endDate}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Setup Progress Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-extrabold tracking-tight sm:text-lg">School Setup Progress</h2>
            <p className="text-xs text-muted-foreground">
              Foundation configuration completed. Future academic and staffing modules will activate in Phase 2.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl">
            <Link to="/setup">
              <SlidersHorizontal className="size-3.5 mr-1.5" /> Continue Setup
            </Link>
          </Button>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <div className="flex items-center gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-3 text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-bold truncate">School Info</p>
              <p className="text-[10px] opacity-80">Completed ✓</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-success/30 bg-success/5 p-3 text-success">
            <CheckCircle2 className="size-4 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-bold truncate">Academic Session</p>
              <p className="text-[10px] opacity-80">{activeSession?.name || "Configured ✓"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-3 text-muted-foreground opacity-70">
            <Clock className="size-4 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-bold truncate">Classes</p>
              <p className="text-[10px]">Phase 2</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-3 text-muted-foreground opacity-70">
            <Clock className="size-4 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-bold truncate">Subjects</p>
              <p className="text-[10px]">Phase 2</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 rounded-2xl border border-border bg-surface p-3 text-muted-foreground opacity-70">
            <Clock className="size-4 shrink-0" />
            <div className="truncate">
              <p className="text-[11px] font-bold truncate">Staff & Faculty</p>
              <p className="text-[10px]">Phase 2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Getting Started Section */}
      <div>
        <h2 className="text-base font-extrabold tracking-tight">Getting Started</h2>
        <p className="text-xs text-muted-foreground">
          Core Phase 1 configuration options for your school administration.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1: School Profile (Functional) */}
          <Link
            to="/settings"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lift"
          >
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Building2 className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-foreground">Complete School Profile</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage contact details, official address, and affiliation information.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-semibold text-primary">
              Open Settings <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          {/* Card 2: Academic Session (Functional) */}
          <Link
            to="/settings"
            className="group flex flex-col justify-between rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lift"
          >
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Calendar className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-foreground">Configure Academic Session</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Manage active academic years, term dates, and historical session logs.
              </p>
            </div>
            <span className="mt-4 inline-flex items-center text-xs font-semibold text-primary">
              Manage Sessions <ArrowRight className="size-3.5 ml-1 transition-transform group-hover:translate-x-1" />
            </span>
          </Link>

          {/* Card 3: Add Classes (Phase 2 teaser) */}
          <div className="flex flex-col justify-between rounded-2xl border border-dashed border-border bg-card/60 p-5 opacity-75">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
                <Layers className="size-5" />
              </span>
              <div className="mt-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Add Classes</h3>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                  Phase 2
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Class hierarchies, sections, and intake limits will unlock in Phase 2.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-muted-foreground">Coming in Next Phase</span>
          </div>

          {/* Card 4: Add Subjects (Phase 2 teaser) */}
          <div className="flex flex-col justify-between rounded-2xl border border-dashed border-border bg-card/60 p-5 opacity-75">
            <div>
              <span className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground">
                <BookOpen className="size-5" />
              </span>
              <div className="mt-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">Add Subjects</h3>
                <span className="rounded bg-secondary px-1.5 py-0.5 text-[9px] font-bold uppercase text-muted-foreground">
                  Phase 2
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Curriculum definitions and elective subject mappings will unlock in Phase 2.
              </p>
            </div>
            <span className="mt-4 text-xs font-semibold text-muted-foreground">Coming in Next Phase</span>
          </div>
        </div>
      </div>
    </div>
  );
};
