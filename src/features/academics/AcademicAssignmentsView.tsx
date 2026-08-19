import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  UserCheck,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  GraduationCap,
  BookOpen,
  Users,
  PowerOff,
  Loader2,
  Calendar,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getClassTeacherAssignments,
  getSubjectTeacherAssignments,
  assignClassTeacher,
  assignSubjectTeacher,
  deactivateClassTeacherAssignment,
  deactivateSubjectTeacherAssignment,
  getSchoolClasses,
  getSections,
  getSubjects,
  getTeachers,
  getAcademicSessionsList,
} from "@/services";
import type {
  ClassTeacherAssignment,
  SubjectTeacherAssignment,
  SchoolClass,
  Section,
  Subject,
  Teacher,
  AcademicSessionItem,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const AcademicAssignmentsView: React.FC = () => {
  const { organization, firebaseUser, selectedSession } = useAuth();
  const [activeTab, setActiveTab] = useState<"classTeachers" | "subjectTeachers">("classTeachers");
  const [classAssignments, setClassAssignments] = useState<ClassTeacherAssignment[]>([]);
  const [subjectAssignments, setSubjectAssignments] = useState<SubjectTeacherAssignment[]>([]);

  // Entities for Assignment Modals
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [sessionsList, setSessionsList] = useState<AcademicSessionItem[]>([]);

  // Class Teacher Modal
  const [showCTModal, setShowCTModal] = useState(false);
  const [ctSessionId, setCtSessionId] = useState(selectedSession?.id || "");
  const [ctClassId, setCtClassId] = useState("");
  const [ctSectionId, setCtSectionId] = useState("");
  const [ctTeacherId, setCtTeacherId] = useState("");
  const [isSubmittingCT, setIsSubmittingCT] = useState(false);

  // Subject Teacher Modal
  const [showSTModal, setShowSTModal] = useState(false);
  const [stSessionId, setStSessionId] = useState(selectedSession?.id || "");
  const [stClassId, setStClassId] = useState("");
  const [stSectionId, setStSectionId] = useState("");
  const [stSubjectId, setStSubjectId] = useState("");
  const [stTeacherId, setStTeacherId] = useState("");
  const [isSubmittingST, setIsSubmittingST] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [ctList, stList, classes, sections, subjects, teachers, sessions] = await Promise.all([
        getClassTeacherAssignments(organization.id, selectedSession?.id),
        getSubjectTeacherAssignments(organization.id, selectedSession?.id),
        getSchoolClasses(organization.id, selectedSession?.id),
        getSections(organization.id, undefined, selectedSession?.id),
        getSubjects(organization.id),
        getTeachers(organization.id, "active"),
        getAcademicSessionsList(organization.id),
      ]);

      setClassAssignments(ctList);
      setSubjectAssignments(stList);
      setClassesList(classes);
      setSectionsList(sections);
      setSubjectsList(subjects);
      setTeachersList(teachers);
      setSessionsList(sessions);
    } catch (err: any) {
      setError(err.message || "Failed to load academic assignments");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession]);

  const handleAssignClassTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setIsSubmittingCT(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await assignClassTeacher(
        organization.id,
        {
          academicSessionId: ctSessionId || selectedSession?.id || "",
          classId: ctClassId,
          sectionId: ctSectionId,
          teacherId: ctTeacherId,
        },
        firebaseUser.uid
      );
      setSuccessMsg("Class Teacher assigned successfully. Previous allocation updated.");
      setShowCTModal(false);
      setCtClassId("");
      setCtSectionId("");
      setCtTeacherId("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to assign Class Teacher");
    } finally {
      setIsSubmittingCT(false);
    }
  };

  const handleAssignSubjectTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organization || !firebaseUser) return;
    setIsSubmittingST(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await assignSubjectTeacher(
        organization.id,
        {
          academicSessionId: stSessionId || selectedSession?.id || "",
          classId: stClassId,
          sectionId: stSectionId || null,
          subjectId: stSubjectId,
          teacherId: stTeacherId,
        },
        firebaseUser.uid
      );
      setSuccessMsg("Subject Teacher assigned successfully.");
      setShowSTModal(false);
      setStClassId("");
      setStSectionId("");
      setStSubjectId("");
      setStTeacherId("");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to assign Subject Teacher");
    } finally {
      setIsSubmittingST(false);
    }
  };

  const handleDeactivateCT = async (assignmentId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Deactivate this Class Teacher allocation?")) return;
    try {
      await deactivateClassTeacherAssignment(organization.id, assignmentId, firebaseUser.uid);
      setSuccessMsg("Class Teacher assignment deactivated.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate assignment");
    }
  };

  const handleDeactivateST = async (assignmentId: string) => {
    if (!organization || !firebaseUser) return;
    if (!confirm("Deactivate this Subject Teacher allocation?")) return;
    try {
      await deactivateSubjectTeacherAssignment(organization.id, assignmentId, firebaseUser.uid);
      setSuccessMsg("Subject Teacher assignment deactivated.");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to deactivate assignment");
    }
  };

  const filteredSectionsForCT = sectionsList.filter((s) => !ctClassId || s.classId === ctClassId);
  const filteredSectionsForST = sectionsList.filter((s) => !stClassId || s.classId === stClassId);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Academic Teacher Assignments
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Assign classroom mentor class teachers and map subject educators across sections.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === "classTeachers" ? (
            <Button
              variant="hero"
              size="sm"
              onClick={() => setShowCTModal(true)}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <Plus className="size-3.5 mr-1" /> Assign Class Teacher
            </Button>
          ) : (
            <Button
              variant="hero"
              size="sm"
              onClick={() => setShowSTModal(true)}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              <Plus className="size-3.5 mr-1" /> Assign Subject Teacher
            </Button>
          )}
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

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-3">
        <button
          onClick={() => setActiveTab("classTeachers")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "classTeachers"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <GraduationCap className="size-4" />
          <span>Class Teachers ({classAssignments.filter((a) => a.status === "active").length})</span>
        </button>

        <button
          onClick={() => setActiveTab("subjectTeachers")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
            activeTab === "subjectTeachers"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
          }`}
        >
          <BookOpen className="size-4" />
          <span>Subject Teachers ({subjectAssignments.filter((a) => a.status === "active").length})</span>
        </button>
      </div>

      {/* TAB 1: Class Teachers Table */}
      {activeTab === "classTeachers" && (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="mx-auto size-6 animate-spin text-primary" />
              <p className="mt-2 text-xs">Loading class teacher assignments...</p>
            </div>
          ) : classAssignments.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <UserCheck className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No class teacher assignments found.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCTModal(true)}
                className="mt-4 rounded-xl text-xs"
              >
                + Assign First Class Teacher
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Class</th>
                    <th className="px-4 py-3.5 font-bold">Section</th>
                    <th className="px-4 py-3.5 font-bold">Class Teacher</th>
                    <th className="px-4 py-3.5 font-bold">Employee ID</th>
                    <th className="px-4 py-3.5 font-bold">Assigned Date</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {classAssignments.map((ca) => (
                    <tr key={ca.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        {ca.className}
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {ca.sectionName}
                      </td>
                      <td className="px-4 py-4 font-bold text-primary">
                        <Link to="/academics/teachers/$teacherId" params={{ teacherId: ca.teacherId }} className="hover:underline">
                          {ca.teacherName}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-mono text-muted-foreground">
                        {ca.teacherEmployeeId || "—"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {ca.assignedDate}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            ca.status === "active"
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {ca.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {ca.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateCT(ca.id)}
                            className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
                          >
                            <PowerOff className="size-3.5 mr-1" /> Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Subject Teachers Table */}
      {activeTab === "subjectTeachers" && (
        <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground">
              <Loader2 className="mx-auto size-6 animate-spin text-primary" />
              <p className="mt-2 text-xs">Loading subject teacher assignments...</p>
            </div>
          ) : subjectAssignments.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <BookOpen className="mx-auto size-8 opacity-40" />
              <p className="mt-2 text-xs font-semibold">No subject teacher assignments found.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSTModal(true)}
                className="mt-4 rounded-xl text-xs"
              >
                + Assign First Subject Teacher
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-6 py-3.5 font-bold">Teacher Name</th>
                    <th className="px-4 py-3.5 font-bold">Subject</th>
                    <th className="px-4 py-3.5 font-bold">Class</th>
                    <th className="px-4 py-3.5 font-bold">Section</th>
                    <th className="px-4 py-3.5 font-bold">Assigned Date</th>
                    <th className="px-4 py-3.5 font-bold">Status</th>
                    <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {subjectAssignments.map((sa) => (
                    <tr key={sa.id} className="hover:bg-secondary/40 transition-colors">
                      <td className="px-6 py-4 font-bold text-foreground">
                        <Link to="/academics/teachers/$teacherId" params={{ teacherId: sa.teacherId }} className="hover:underline">
                          {sa.teacherName}
                        </Link>
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {sa.subjectName} <span className="font-mono text-[10px] text-muted-foreground">({sa.subjectCode})</span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-foreground">
                        {sa.className}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {sa.sectionName || "All Sections"}
                      </td>
                      <td className="px-4 py-4 text-muted-foreground">
                        {sa.assignedDate}
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                            sa.status === "active"
                              ? "bg-success/15 text-success"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {sa.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {sa.status === "active" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeactivateST(sa.id)}
                            className="rounded-xl text-xs text-muted-foreground hover:text-destructive"
                          >
                            <PowerOff className="size-3.5 mr-1" /> Deactivate
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Assign Class Teacher */}
      {showCTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Assign Class Teacher
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select class and section. Note: Assigning a new class teacher automatically deactivates previous allocation.
            </p>

            <form onSubmit={handleAssignClassTeacher} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Academic Session *</label>
                <select
                  value={ctSessionId}
                  onChange={(e) => setCtSessionId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {sessionsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isActive ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Class *</label>
                <select
                  value={ctClassId}
                  onChange={(e) => {
                    setCtClassId(e.target.value);
                    setCtSectionId("");
                  }}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Section *</label>
                <select
                  value={ctSectionId}
                  onChange={(e) => setCtSectionId(e.target.value)}
                  required
                  disabled={!ctClassId}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">-- Choose Section --</option>
                  {filteredSectionsForCT.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Teacher *</label>
                <select
                  value={ctTeacherId}
                  onChange={(e) => setCtTeacherId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.personal.fullName} ({t.employeeId}) - {t.professional.department || "Faculty"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCTModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSubmittingCT || !ctClassId || !ctSectionId || !ctTeacherId}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmittingCT ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Assign Class Teacher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Assign Subject Teacher */}
      {showSTModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Assign Subject Teacher
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Select course subject, class, section, and faculty member.
            </p>

            <form onSubmit={handleAssignSubjectTeacher} className="mt-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Academic Session *</label>
                <select
                  value={stSessionId}
                  onChange={(e) => setStSessionId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {sessionsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} {s.isActive ? "(Active)" : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Teacher *</label>
                <select
                  value={stTeacherId}
                  onChange={(e) => setStTeacherId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Teacher --</option>
                  {teachersList.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.personal.fullName} ({t.employeeId})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Subject *</label>
                <select
                  value={stSubjectId}
                  onChange={(e) => setStSubjectId(e.target.value)}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Subject --</option>
                  {subjectsList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Class *</label>
                <select
                  value={stClassId}
                  onChange={(e) => {
                    setStClassId(e.target.value);
                    setStSectionId("");
                  }}
                  required
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">-- Choose Class --</option>
                  {classesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold">Select Section (Optional)</label>
                <select
                  value={stSectionId}
                  onChange={(e) => setStSectionId(e.target.value)}
                  disabled={!stClassId}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
                >
                  <option value="">-- All Sections in Class --</option>
                  {filteredSectionsForST.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSTModal(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSubmittingST || !stClassId || !stSubjectId || !stTeacherId}
                  className="rounded-xl text-xs font-bold"
                >
                  {isSubmittingST ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Assign Subject Teacher
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
