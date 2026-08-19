import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  ArrowLeft,
  GraduationCap,
  Users,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSubjectById,
  getSchoolClasses,
  getSubjectTeacherAssignments,
  getTeachers,
} from "@/services";
import type {
  Subject,
  SchoolClass,
  SubjectTeacherAssignment,
  Teacher,
} from "@/types";
import { Button } from "@/components/ui/button";

interface SubjectDetailViewProps {
  subjectId: string;
}

export const SubjectDetailView: React.FC<SubjectDetailViewProps> = ({ subjectId }) => {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "classes" | "teachers">("overview");
  const [subject, setSubject] = useState<Subject | null>(null);
  const [allClasses, setAllClasses] = useState<SchoolClass[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherAssignment[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const sub = await getSubjectById(organization.id, subjectId);
      if (!sub) throw new Error("Subject not found");
      setSubject(sub);

      const [classes, stAssignments, teachers] = await Promise.all([
        getSchoolClasses(organization.id),
        getSubjectTeacherAssignments(organization.id),
        getTeachers(organization.id, "active"),
      ]);

      setAllClasses(classes);
      setSubjectTeachers(
        stAssignments.filter((a) => a.subjectId === subjectId && a.status === "active")
      );
      setTeachersList(teachers);
    } catch (err: any) {
      setError(err.message || "Failed to load subject details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, subjectId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-7 animate-spin text-primary" />
        <p className="mt-2 text-xs">Loading subject details...</p>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="mt-2 text-sm font-bold">Subject Not Found</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/academics/subjects">Back to Subjects</Link>
        </Button>
      </div>
    );
  }

  const assignedClasses = allClasses.filter((c) =>
    subject.assignedClassIds?.includes(c.id)
  );

  const tabs = [
    { id: "overview", label: "Overview & Marks", icon: BookOpen },
    { id: "classes", label: `Enrolled Classes (${assignedClasses.length})`, icon: GraduationCap },
    { id: "teachers", label: `Assigned Faculty (${subjectTeachers.length})`, icon: Users },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/academics/subjects">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {subject.name}
              </h1>
              <span className="rounded-md bg-card border border-border px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                {subject.code}
              </span>
              <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-extrabold">
                {subject.type}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  subject.status === "active"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {subject.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {subject.description || "No description provided"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/academics/assignments">
              <Users className="size-3.5 mr-1" /> Assign Teachers
            </Link>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <tab.icon className="size-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: Overview */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Max Total Marks</span>
              <p className="mt-2 text-2xl font-black text-foreground">{subject.marks.maximum}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Passing Marks</span>
              <p className="mt-2 text-2xl font-black text-emerald-600">{subject.marks.passing}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Theory Component</span>
              <p className="mt-2 text-2xl font-black text-foreground">{subject.marks.theory ?? 0}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Practical / Viva</span>
              <p className="mt-2 text-2xl font-black text-foreground">{subject.marks.practical ?? 0}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Classes */}
      {activeTab === "classes" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
            Classes Teaching {subject.name}
          </h2>

          {assignedClasses.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <GraduationCap className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">This subject is not mapped to any class yet.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
                <Link to="/academics/classes">+ Go to Classes to Map Subject</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {assignedClasses.map((c) => (
                <Link
                  key={c.id}
                  to="/academics/classes/$classId"
                  params={{ classId: c.id }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 transition-all hover:bg-secondary hover:border-primary/40"
                >
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-xl bg-card border border-border font-bold text-xs">
                      {c.code}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground">{c.sectionsCount || 1} Sections</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Teachers */}
      {activeTab === "teachers" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
            Assigned Teachers for {subject.name}
          </h2>

          {subjectTeachers.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No teachers currently assigned to this subject.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
                <Link to="/academics/assignments">+ Assign Subject Teacher</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {subjectTeachers.map((st) => (
                <div key={st.id} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs font-bold text-foreground">{st.teacherName}</p>
                  <p className="text-[10px] text-muted-foreground">
                    Class: <span className="font-semibold text-foreground">{st.className}</span> {st.sectionName ? `(${st.sectionName})` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
