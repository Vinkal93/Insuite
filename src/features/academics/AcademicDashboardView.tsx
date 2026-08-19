import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Layers,
  BookOpen,
  Users,
  Calendar,
  UserCheck,
  AlertCircle,
  Plus,
  ArrowRight,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Settings,
  HelpCircle,
  Clock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAcademicDashboardStats,
  getAcademicSessionsList,
  getSchoolClasses,
  getTeachers,
} from "@/services";
import type {
  AcademicDashboardStats,
  AcademicSessionItem,
  SchoolClass,
  Teacher,
} from "@/types";
import { Button } from "@/components/ui/button";

export const AcademicDashboardView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [stats, setStats] = useState<AcademicDashboardStats | null>(null);
  const [activeSessionItem, setActiveSessionItem] = useState<AcademicSessionItem | null>(null);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!organization) return;
    const fetchDashboard = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [dashStats, sessions, classes, teachers] = await Promise.all([
          getAcademicDashboardStats(organization.id, selectedSession?.id),
          getAcademicSessionsList(organization.id),
          getSchoolClasses(organization.id, selectedSession?.id),
          getTeachers(organization.id),
        ]);

        setStats(dashStats);
        const currentActive = sessions.find((s) => s.isActive) || sessions[0] || null;
        setActiveSessionItem(currentActive);
        setClassesList(classes.slice(0, 6));
        setTeachersList(teachers.slice(0, 5));
      } catch (err: any) {
        console.error("Academic dashboard error:", err);
        setError(err.message || "Failed to load academic data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboard();
  }, [organization, selectedSession]);

  return (
    <div className="space-y-8 pb-12">
      {/* 1. Header Section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="size-3.5" />
            Core Academic Architecture
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Academic Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage your school's academic structure, classes, curriculum, and faculty from one place.
          </p>
        </div>

        {/* Quick Add Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academics/classes/new">
              <Plus className="size-3.5 mr-1 text-primary" /> Add Class
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academics/subjects/new">
              <Plus className="size-3.5 mr-1 text-emerald-500" /> Add Subject
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/academics/teachers/new">
              <Plus className="size-3.5 mr-1" /> Add Teacher
            </Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 2. Prominent Active Academic Session Card */}
      <div className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-card to-card p-6 shadow-soft sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-md shrink-0">
              <Calendar className="size-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">
                  Current Session
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-0.5 text-[10px] font-extrabold uppercase text-success">
                  <span className="size-1.5 rounded-full bg-success animate-pulse" />
                  {activeSessionItem?.isActive ? "Active" : "Configured"}
                </span>
              </div>
              <h2 className="mt-1 text-2xl font-black tracking-tight text-foreground">
                Session {activeSessionItem?.name || "2026-27"}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2">
                <span>{activeSessionItem?.startDate || "2026-04-01"}</span>
                <span>→</span>
                <span>{activeSessionItem?.endDate || "2027-03-31"}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold bg-card/80">
              <Link to="/academics/sessions">
                View All Sessions
              </Link>
            </Button>
            {activeSessionItem && (
              <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold">
                <Link to="/academics/sessions/$sessionId" params={{ sessionId: activeSessionItem.id }}>
                  Manage Active Session →
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 3. Real Statistics Cards Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Classes</span>
            <div className="grid size-8 place-items-center rounded-xl bg-blue-500/10 text-blue-500">
              <GraduationCap className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {isLoading ? "..." : stats?.totalClasses ?? 0}
          </p>
          <Link
            to="/academics/classes"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            Manage Classes <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Sections</span>
            <div className="grid size-8 place-items-center rounded-xl bg-purple-500/10 text-purple-500">
              <Layers className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {isLoading ? "..." : stats?.totalSections ?? 0}
          </p>
          <Link
            to="/academics/sections"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            Manage Sections <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Subjects</span>
            <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-500">
              <BookOpen className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {isLoading ? "..." : stats?.totalSubjects ?? 0}
          </p>
          <Link
            to="/academics/subjects"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            Manage Subjects <ChevronRight className="size-3" />
          </Link>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft transition-all hover:border-primary/30">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Faculty Teachers</span>
            <div className="grid size-8 place-items-center rounded-xl bg-amber-500/10 text-amber-500">
              <Users className="size-4" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-black tracking-tight text-foreground">
            {isLoading ? "..." : stats?.totalTeachers ?? 0}
          </p>
          <Link
            to="/academics/teachers"
            className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
          >
            Manage Faculty <ChevronRight className="size-3" />
          </Link>
        </div>
      </div>

      {/* 4. Operational Alignment Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4">
          <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
            <UserCheck className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Assigned Teachers</p>
            <p className="text-lg font-black text-foreground">{isLoading ? "..." : stats?.assignedTeachersCount ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <BookOpen className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Unassigned Subjects</p>
            <p className="text-lg font-black text-foreground">{isLoading ? "..." : stats?.unassignedSubjectsCount ?? 0}</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-border bg-surface p-4">
          <div className="grid size-10 place-items-center rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <AlertCircle className="size-5" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Unassigned Classes</p>
            <p className="text-lg font-black text-foreground">{isLoading ? "..." : stats?.unassignedClassesCount ?? 0}</p>
          </div>
        </div>
      </div>

      {/* 5. Main Academics Hub Navigation Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Classes & Sections Hub */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <GraduationCap className="size-5 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Classes Overview</h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary font-bold">
              <Link to="/academics/classes">View All Classes →</Link>
            </Button>
          </div>

          {classesList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-xs">No classes created yet in this session.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
                <Link to="/academics/classes/new">+ Create First Class</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {classesList.map((c) => (
                <Link
                  key={c.id}
                  to="/academics/classes/$classId"
                  params={{ classId: c.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface/60 p-3.5 transition-all hover:bg-secondary hover:border-primary/30 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-card border border-border text-xs font-extrabold text-foreground group-hover:border-primary/40">
                      {c.code}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {c.sectionsCount || 1} Sections • {c.subjectsCount || 0} Subjects
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-transform" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Faculty Teachers Quick List */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Users className="size-5 text-emerald-500" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">Faculty Staff</h2>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary font-bold">
              <Link to="/academics/teachers">View All Faculty →</Link>
            </Button>
          </div>

          {teachersList.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <p className="text-xs">No teachers registered yet.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
                <Link to="/academics/teachers/new">+ Add First Teacher</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {teachersList.map((t) => (
                <Link
                  key={t.id}
                  to="/academics/teachers/$teacherId"
                  params={{ teacherId: t.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface/60 p-3.5 transition-all hover:bg-secondary hover:border-primary/30 group"
                >
                  <div className="flex items-center gap-3">
                    {t.personal.photoUrl ? (
                      <img src={t.personal.photoUrl} alt={t.personal.fullName} className="size-9 rounded-xl object-cover" />
                    ) : (
                      <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary text-xs font-extrabold">
                        {t.personal.firstName.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-foreground">{t.personal.fullName}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">
                        {t.employeeId} • {t.professional.designation || t.professional.department || "Faculty"}
                      </p>
                    </div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                    t.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"
                  }`}>
                    {t.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
