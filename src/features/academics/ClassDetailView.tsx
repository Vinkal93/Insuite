import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  ArrowLeft,
  Layers,
  BookOpen,
  Users,
  UserCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSchoolClassById,
  getSections,
  getClassSubjects,
  getClassStudents,
  getSubjects,
  getTeachers,
  assignSubjectToClass,
  removeSubjectFromClass,
  getClassTeacherAssignments,
  getSubjectTeacherAssignments,
} from "@/services";
import type {
  SchoolClass,
  Section,
  ClassSubjectMapping,
  Subject,
  Teacher,
  Student,
  ClassTeacherAssignment,
  SubjectTeacherAssignment,
} from "@/types";
import { Button } from "@/components/ui/button";

interface ClassDetailViewProps {
  classId: string;
}

export const ClassDetailView: React.FC<ClassDetailViewProps> = ({ classId }) => {
  const { organization, firebaseUser } = useAuth();
  const [activeTab, setActiveTab] = useState<"overview" | "sections" | "subjects" | "students" | "teachers">("overview");
  const [schoolClass, setSchoolClass] = useState<SchoolClass | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjectsMapping, setSubjectsMapping] = useState<ClassSubjectMapping[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [classTeachers, setClassTeachers] = useState<ClassTeacherAssignment[]>([]);
  const [subjectTeachers, setSubjectTeachers] = useState<SubjectTeacherAssignment[]>([]);

  // Assign Subject Modal
  const [showAssignSubjectModal, setShowAssignSubjectModal] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const cls = await getSchoolClassById(organization.id, classId);
      if (!cls) throw new Error("Class not found");
      setSchoolClass(cls);

      const [secs, mappings, stus, allSubs, teachers, ctAssignments, stAssignments] = await Promise.all([
        getSections(organization.id, classId, cls.academicSessionId),
        getClassSubjects(organization.id, classId, cls.academicSessionId),
        getClassStudents(organization.id, classId, cls.academicSessionId),
        getSubjects(organization.id),
        getTeachers(organization.id, "active"),
        getClassTeacherAssignments(organization.id, cls.academicSessionId),
        getSubjectTeacherAssignments(organization.id, cls.academicSessionId),
      ]);

      setSections(secs);
      setSubjectsMapping(mappings);
      setStudents(stus);
      setAllSubjects(allSubs);
      setAllTeachers(teachers);
      setClassTeachers(ctAssignments.filter((a) => a.classId === classId && a.status === "active"));
      setSubjectTeachers(stAssignments.filter((a) => a.classId === classId && a.status === "active"));
    } catch (err: any) {
      setError(err.message || "Failed to load class details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, classId]);

  const handleAssignSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser || !schoolClass || !selectedSubjectId) return;
    setIsAssigning(true);
    setSuccessMsg(null);
    setError(null);
    try {
      await assignSubjectToClass(
        organization.id,
        schoolClass.academicSessionId,
        classId,
        selectedSubjectId,
        selectedTeacherId || null,
        firebaseUser.uid
      );
      setSuccessMsg("Subject mapped to class successfully.");
      setShowAssignSubjectModal(false);
      setSelectedSubjectId("");
      setSelectedTeacherId("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to assign subject");
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveSubject = async (mappingId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Are you sure you want to remove this subject mapping?")) return;
    try {
      await removeSubjectFromClass(organization.id, mappingId, firebaseUser.uid);
      setSuccessMsg("Subject mapping removed.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to remove subject");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <Loader2 className="mx-auto size-7 animate-spin text-primary" />
        <p className="mt-2 text-xs">Loading class details...</p>
      </div>
    );
  }

  if (!schoolClass) {
    return (
      <div className="py-20 text-center text-muted-foreground">
        <AlertCircle className="mx-auto size-8 text-destructive" />
        <p className="mt-2 text-sm font-bold">Class Not Found</p>
        <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
          <Link to="/academics/classes">Back to Classes</Link>
        </Button>
      </div>
    );
  }

  const tabs = [
    { id: "overview", label: "Overview", icon: GraduationCap },
    { id: "sections", label: `Sections (${sections.length})`, icon: Layers },
    { id: "subjects", label: `Subjects (${subjectsMapping.length})`, icon: BookOpen },
    { id: "students", label: `Students (${students.length})`, icon: Users },
    { id: "teachers", label: `Teachers (${classTeachers.length + subjectTeachers.length})`, icon: UserCheck },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
            <Link to="/academics/classes">
              <ArrowLeft className="size-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
                {schoolClass.name}
              </h1>
              <span className="rounded-md bg-card border border-border px-2 py-0.5 font-mono text-xs font-bold text-foreground">
                Code: {schoolClass.code}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  schoolClass.status === "active"
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {schoolClass.status}
              </span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Display Order #{schoolClass.displayOrder} • {schoolClass.description || "No description provided"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
            <Link to="/academics/sections/new">
              <Plus className="size-3.5 mr-1" /> Add Section
            </Link>
          </Button>
          <Button
            variant="hero"
            size="sm"
            onClick={() => setShowAssignSubjectModal(true)}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            <Plus className="size-3.5 mr-1" /> Assign Subject
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

      {/* Tabs Bar */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setSuccessMsg(null);
                setErrorMsg(null);
              }}
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
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Sections</span>
              <p className="mt-2 text-2xl font-black text-foreground">{sections.length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Subjects Mapped</span>
              <p className="mt-2 text-2xl font-black text-foreground">{subjectsMapping.length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Enrolled Students</span>
              <p className="mt-2 text-2xl font-black text-primary">{students.length}</p>
            </div>
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Faculty Allocation</span>
              <p className="mt-2 text-2xl font-black text-foreground">{classTeachers.length + subjectTeachers.length}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Class Summary & Details
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <p className="text-muted-foreground">Full Class Name</p>
                <p className="font-bold text-foreground text-sm mt-0.5">{schoolClass.name}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Class Code</p>
                <p className="font-mono font-bold text-foreground text-sm mt-0.5">{schoolClass.code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Display Order</p>
                <p className="font-bold text-foreground mt-0.5">#{schoolClass.displayOrder}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Description</p>
                <p className="font-medium text-foreground mt-0.5">{schoolClass.description || "None"}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: Sections */}
      {activeTab === "sections" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Sections in {schoolClass.name}
            </h2>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/academics/sections/new">
                <Plus className="size-3.5 mr-1" /> Add Section
              </Link>
            </Button>
          </div>

          {sections.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <p className="text-xs">No sections configured yet.</p>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sections.map((sec) => (
                <Link
                  key={sec.id}
                  to="/academics/sections/$sectionId"
                  params={{ sectionId: sec.id }}
                  className="rounded-2xl border border-border bg-surface p-4 transition-all hover:bg-secondary hover:border-primary/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="grid size-9 place-items-center rounded-xl bg-card border border-border font-bold text-xs text-foreground">
                        {sec.code}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{sec.name}</p>
                        <p className="text-[10px] text-muted-foreground">{sec.room || "Room unassigned"}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                      Cap: {sec.capacity}
                    </span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/60 text-[11px] text-muted-foreground flex justify-between">
                    <span>Teacher: {sec.classTeacherName || "Unassigned"}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Subjects */}
      {activeTab === "subjects" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Curriculum & Subjects for {schoolClass.name}
            </h2>
            <Button
              variant="hero"
              size="sm"
              onClick={() => setShowAssignSubjectModal(true)}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <Plus className="size-3.5 mr-1" /> Assign Subject
            </Button>
          </div>

          {subjectsMapping.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <BookOpen className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No subjects assigned to this class yet.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAssignSubjectModal(true)}
                className="mt-3 rounded-xl text-xs"
              >
                + Map Subject to Class
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Subject</th>
                    <th className="px-4 py-3 font-bold">Code</th>
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold">Assigned Teacher</th>
                    <th className="px-4 py-3 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjectsMapping.map((m) => (
                    <tr key={m.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        {m.subjectName}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground font-semibold">
                        {m.subjectCode}
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-surface border border-border px-2 py-0.5 text-[10px] font-semibold">
                          {m.subjectType || "Core"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {m.teacherName || <span className="text-amber-500 font-medium">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveSubject(m.id)}
                          className="size-8 rounded-xl text-muted-foreground hover:text-destructive"
                          title="Remove subject mapping"
                        >
                          <Trash2 className="size-3.5" />
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

      {/* TAB 4: Students (Phase 3 Integration) */}
      {activeTab === "students" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Enrolled Students in {schoolClass.name}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Queried live from the Phase 3 Student Directory without data duplication.
              </p>
            </div>
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/students/new">
                <Plus className="size-3.5 mr-1" /> Add Student
              </Link>
            </Button>
          </div>

          {students.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Users className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No students currently enrolled in this class.</p>
              <Button variant="outline" size="sm" asChild className="mt-3 rounded-xl text-xs">
                <Link to="/students/new">+ Enroll First Student</Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3 font-bold">Student Name</th>
                    <th className="px-4 py-3 font-bold">Student ID</th>
                    <th className="px-4 py-3 font-bold">Roll No</th>
                    <th className="px-4 py-3 font-bold">Gender</th>
                    <th className="px-4 py-3 font-bold">Status</th>
                    <th className="px-4 py-3 font-bold text-right">Profile</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((st) => (
                    <tr key={st.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">
                        <Link
                          to="/students/$studentId"
                          params={{ studentId: st.id }}
                          className="hover:underline"
                        >
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
                            View <ExternalLink className="size-3 ml-1" />
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

      {/* TAB 5: Teachers */}
      {activeTab === "teachers" && (
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-6">
          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Class Teachers
            </h2>
            {classTeachers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No class teacher assigned yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {classTeachers.map((ct) => (
                  <div key={ct.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                    <div>
                      <p className="text-xs font-bold text-foreground">{ct.teacherName}</p>
                      <p className="text-[10px] text-muted-foreground">Section: {ct.sectionName} • ID: {ct.teacherEmployeeId}</p>
                    </div>
                    <span className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase">
                      Class Teacher
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground pb-2 border-b border-border">
              Subject Teachers
            </h2>
            {subjectTeachers.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">No subject teachers assigned yet.</p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {subjectTeachers.map((st) => (
                  <div key={st.id} className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4">
                    <div>
                      <p className="text-xs font-bold text-foreground">{st.teacherName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Subject: <span className="font-semibold text-foreground">{st.subjectName}</span> {st.sectionName ? `(${st.sectionName})` : ""}
                      </p>
                    </div>
                    <span className="rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[10px] font-extrabold uppercase">
                      Subject Faculty
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assign Subject Modal */}
      {showAssignSubjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Map Subject to {schoolClass.name}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select a curriculum subject to add to this class.
            </p>

            <form onSubmit={handleAssignSubject} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Subject *</label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Subject --</option>
                  {allSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Assign Teacher (Optional)</label>
                <select
                  value={selectedTeacherId}
                  onChange={(e) => setSelectedTeacherId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Assign Later --</option>
                  {allTeachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.personal.fullName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAssignSubjectModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isAssigning || !selectedSubjectId}
                  className="rounded-xl text-xs font-bold"
                >
                  {isAssigning ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Assign Subject
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
