import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
  ArrowLeft,
  GraduationCap,
  Users,
  BookOpen,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSectionById,
  getSectionStudents,
  getClassSubjects,
  getSubjectTeacherAssignments,
  getClassTeacherAssignments,
} from "@/services";
import type {
  Section,
  Student,
  ClassSubjectMapping,
  SubjectTeacherAssignment,
  ClassTeacherAssignment,
} from "@/types";
import { Button } from "@/components/ui/button";

interface SectionDetailViewProps {
  sectionId: string;
}

export const SectionDetailView: React.FC<SectionDetailViewProps> = ({ sectionId }) => {
  const { organization } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "subjects" | "teachers">("overview");
  const [section, setSection] = useState<Section | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<ClassSubjectMapping[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherAssignment[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const sec = await getSectionById(organization.id, sectionId);
      if (!sec) throw new Error("Section not found");
      setSection(sec);

      const [stus, subs, stAssignments, ctAssignments] = await Promise.all([
        getSectionStudents(organization.id, sectionId, sec.academicSessionId),
        getClassSubjects(organization.id, sec.classId, sec.academicSessionId),
        getSubjectTeacherAssignments(organization.id, sec.academicSessionId),
        getClassTeacherAssignments(organization.id, sec.academicSessionId),
      ]);

      setStudents(stus);
      setSubjects(subs);
      setSubjectTeachers(
        stAssignments.filter(
          (a) =>
            a.classId === sec.classId &&
            (!a.sectionId || a.sectionId === sectionId) &&
            a.status === "active"
        )
      );
      setClassTeachers(
        ctAssignments.filter(
          (a) => a.sectionId === sectionId && a.status === "active"
        )
      );
    } catch (err: any) {
      setError(err.message || "Failed to load section details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, sectionId]);

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-7 animate-spin text-primary" />
        <p className="mt-2 text-xs">Loading section details...</p>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="mt-2 text-sm font-bold">Section Not Found</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/academics/sections">Back to Sections</Link>
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: Layers },
    { id: "students", label: `Students (${students.length}/${section.capacity})`, icon: Users },
    { id: "subjects", label: `Subjects (${subjects.length})`, icon: BookOpen },
    { id: "teachers", label: `Teachers (${classTeachers.length + subjectTeachers.length})`, icon: UserCheck },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/academics/sections">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {section.className} — {section.name}
              </h1>
              <span className="rounded-md bg-card border border-border px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                Code: {section.code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  section.status === "active"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {section.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Room: {section.room || "Unassigned"} • Class Teacher: {section.classTeacherName || "None"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/students/new">
              <Plus className="size-3.5 mr-1" /> Enroll Student
            </Link>
          </Button>
          <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
            <Link to="/academics/assignments">
              <UserCheck className="size-3.5 mr-1" /> Manage Assignments
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Enrolled Students</span>
              <p className="mt-2 text-2xl font-black text-primary">{students.length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Batch Capacity</span>
              <p className="mt-2 text-2xl font-black text-foreground">{section.capacity}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Room Allocation</span>
              <p className="mt-2 text-lg font-black text-foreground">{section.room || "None"}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Class Teacher</span>
              <p className="mt-2 text-xs font-extrabold text-foreground truncate">{section.classTeacherName || "Unassigned"}</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Students (Phase 3 Integration) */}
      {activeTab === "students" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Students Enrolled in {section.className} ({section.name})
            </h2>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/students/new">+ Enroll Student</Link>
            </Button>
          </div>

          {students.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No students in this section yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Student Name</th>
                    <th className="px-4 py-3 font-bold">Admission ID</th>
                    <th className="px-4 py-3 font-bold">Roll No</th>
                    <th className="px-4 py-3 font-bold">Gender</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        <Link to="/students/$studentId" params={{ studentId: st.id }} className="hover:underline">
                          {st.personal.fullName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground font-semibold">
                        {st.admissionNumber}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-semibold">
                        {st.academic.rollNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground capitalize">
                        {st.personal.gender}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-success/15 text-success px-2 py-0.5 text-[10px] font-bold uppercase">
                          {st.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
                          <Link to="/students/$studentId" params={{ studentId: st.id }}>
                            Profile <ExternalLink className="size-3 ml-1" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Subjects */}
      {activeTab === "subjects" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-foreground pb-2 border-b border-border">
            Mapped Curriculum Subjects
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subjects.map((s) => (
              <div key={s.id} className="rounded-2xl border border-border bg-surface p-4">
                <p className="text-xs font-bold text-foreground">{s.subjectName}</p>
                <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{s.subjectCode} • {s.subjectType}</p>
                <p className="text-[11px] text-primary font-semibold mt-2">
                  Faculty: {s.teacherName || "Unassigned"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: Teachers */}
      {activeTab === "teachers" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Assigned Class Teacher
            </h2>
            {classTeachers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No active class teacher assigned to this section.</p>
            ) : (
              classTeachers.map((ct) => (
                <div key={ct.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                  <div>
                    <p className="text-xs font-bold text-foreground">{ct.teacherName}</p>
                    <p className="text-[10px] text-muted-foreground">ID: {ct.teacherEmployeeId}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 text-primary px-2.5 py-0.5 text-[10px] font-extrabold uppercase">
                    Class Teacher
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Subject Faculty
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {subjectTeachers.map((st) => (
                <div key={st.id} className="rounded-2xl border border-border bg-surface p-4">
                  <p className="text-xs font-bold text-foreground">{st.teacherName}</p>
                  <p className="text-[10px] text-muted-foreground">Subject: {st.subjectName} ({st.subjectCode})</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
