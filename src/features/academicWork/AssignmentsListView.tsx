import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  MoreHorizontal,
  GraduationCap,
  Layers,
  BookOpen,
  Filter,
  Trash2,
  Edit,
  Eye,
  Archive,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAssignments,
  getSchoolClasses,
  getSections,
  getSubjects,
  getTeachers,
  closeAssignment,
  archiveAssignment,
  deleteAssignment,
} from "@/services";
import type {
  Assignment,
  AssignmentType,
  AssignmentStatus,
  SchoolClass,
  Section,
  Subject,
  Teacher,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AssignmentsListViewProps {
  fixedType?: AssignmentType;
  titleOverride?: string;
  subtitleOverride?: string;
}

export const AssignmentsListView: React.FC<AssignmentsListViewProps> = ({
  fixedType,
  titleOverride,
  subtitleOverride,
}) => {
  const { organization, selectedSession, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);

  const [selectedType, setSelectedType] = useState<AssignmentType | "ALL">(fixedType || "ALL");
  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedSectionId, setSelectedSectionId] = useState<string>("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<AssignmentStatus | "ALL">("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadInitialData = async () => {
    if (!organization) return;
    try {
      const [cls, subjs, tchs] = await Promise.all([
        getSchoolClasses(organization.id, selectedSession?.id),
        getSubjects(organization.id),
        getTeachers(organization.id, "active"),
      ]);
      setClasses(cls);
      setSubjects(subjs);
      setTeachers(tchs);
    } catch (e) {
      console.warn("Failed to load filter lookups:", e);
    }
  };

  const loadAssignments = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAssignments(organization.id, {
        type: fixedType || (selectedType !== "ALL" ? selectedType : undefined),
        classId: selectedClassId !== "ALL" ? selectedClassId : undefined,
        sectionId: selectedSectionId !== "ALL" ? selectedSectionId : undefined,
        subjectId: selectedSubjectId !== "ALL" ? selectedSubjectId : undefined,
        status: selectedStatus !== "ALL" ? selectedStatus : undefined,
        academicSessionId: selectedSession?.id,
      });
      setAssignments(result);
    } catch (err: any) {
      console.error("Load assignments error:", err);
      setError(err.message || "Unable to load assignments.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [organization, selectedSession]);

  useEffect(() => {
    loadAssignments();
  }, [
    organization,
    selectedSession,
    selectedType,
    selectedClassId,
    selectedSectionId,
    selectedSubjectId,
    selectedStatus,
  ]);

  useEffect(() => {
    if (!organization || selectedClassId === "ALL") {
      setSections([]);
      return;
    }
    getSections(organization.id, selectedClassId, selectedSession?.id).then(setSections);
  }, [organization, selectedClassId, selectedSession]);

  const handleClose = async (id: string) => {
    if (!organization || !firebaseUser) return;
    setActionLoadingId(id);
    try {
      await closeAssignment(
        organization.id,
        id,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Assignment marked as closed.");
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || "Unable to close assignment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleArchive = async (id: string) => {
    if (!organization || !firebaseUser) return;
    setActionLoadingId(id);
    try {
      await archiveAssignment(
        organization.id,
        id,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Assignment archived.");
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || "Unable to archive assignment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (a: Assignment) => {
    if (!organization || !firebaseUser) return;
    if (!confirm(`Are you sure you want to delete assignment "${a.title}"?`)) return;
    setActionLoadingId(a.id);
    try {
      await deleteAssignment(
        organization.id,
        a.id,
        firebaseUser.uid,
        userProfile?.displayName || "Teacher"
      );
      setSuccessMsg("Assignment deleted successfully.");
      await loadAssignments();
    } catch (err: any) {
      setError(err.message || "Unable to delete assignment.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    const matchQuery =
      a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.className?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchQuery;
  });

  const pageTitle = titleOverride || (fixedType ? `${fixedType} List` : "Assignments & Academic Tasks");
  const pageSubtitle =
    subtitleOverride ||
    (fixedType
      ? `Manage and monitor ${fixedType.toLowerCase()} assignments across classes.`
      : "Manage homework, classwork, worksheets, and project tasks.");

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {pageTitle}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">{pageSubtitle}</p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link
            to="/academic-work/assignments/new"
            search={fixedType ? { type: fixedType } : undefined}
          >
            <Plus className="size-3.5 mr-1" /> + Create {fixedType || "Assignment"}
          </Link>
        </Button>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadAssignments}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {/* Search */}
          <div className="relative sm:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title, subject..."
              className="pl-9 rounded-xl border-border bg-surface text-xs"
            />
          </div>

          {/* Class Filter */}
          <select
            value={selectedClassId}
            onChange={(e) => {
              setSelectedClassId(e.target.value);
              setSelectedSectionId("ALL");
            }}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Subject Filter */}
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Subjects</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value as any)}
            className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="ALL">All Statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="closed">Closed</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading tasks...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <FileText className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">
              No {fixedType ? fixedType.toLowerCase() : "assignments"} found.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mt-4 rounded-xl text-xs font-semibold"
            >
              <Link
                to="/academic-work/assignments/new"
                search={fixedType ? { type: fixedType } : undefined}
              >
                + Create First {fixedType || "Assignment"}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Title</th>
                  {!fixedType && <th className="px-4 py-3.5 font-bold">Type</th>}
                  <th className="px-4 py-3.5 font-bold">Class & Section</th>
                  <th className="px-4 py-3.5 font-bold">Subject</th>
                  <th className="px-4 py-3.5 font-bold">Teacher</th>
                  <th className="px-4 py-3.5 font-bold">Due Date</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredAssignments.map((a) => (
                  <tr key={a.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground max-w-xs">
                      <Link
                        to="/academic-work/assignments/$assignmentId"
                        params={{ assignmentId: a.id }}
                        className="hover:underline text-foreground hover:text-primary font-bold block truncate"
                      >
                        {a.title}
                      </Link>
                      {a.attachments && a.attachments.length > 0 && (
                        <span className="text-[10px] text-muted-foreground font-semibold">
                          📎 {a.attachments.length} attachment{a.attachments.length > 1 ? "s" : ""}
                        </span>
                      )}
                    </td>
                    {!fixedType && (
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-secondary px-2.5 py-0.5 text-[10px] font-bold">
                          {a.type}
                        </span>
                      </td>
                    )}
                    <td className="px-4 py-4 text-foreground font-semibold">
                      {a.className} ({a.sectionName})
                    </td>
                    <td className="px-4 py-4 text-foreground font-medium">
                      {a.subjectName}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {a.teacherName}
                    </td>
                    <td className="px-4 py-4 font-mono font-medium text-foreground">
                      {a.dueDate} {a.dueTime ? `(${a.dueTime})` : ""}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          a.status === "published"
                            ? "bg-success/15 text-success"
                            : a.status === "draft"
                            ? "bg-secondary text-muted-foreground"
                            : a.status === "closed"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
                          <Link
                            to="/academic-work/assignments/$assignmentId"
                            params={{ assignmentId: a.id }}
                          >
                            <Eye className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Link>
                        </Button>
                        <Button variant="ghost" size="icon" asChild className="size-8 rounded-xl">
                          <Link
                            to="/academic-work/assignments/$assignmentId/edit"
                            params={{ assignmentId: a.id }}
                          >
                            <Edit className="size-3.5 text-muted-foreground hover:text-foreground" />
                          </Link>
                        </Button>
                        {a.status === "published" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            disabled={actionLoadingId === a.id}
                            onClick={() => handleClose(a.id)}
                            title="Close Submissions"
                            className="size-8 rounded-xl text-amber-500 hover:bg-amber-500/10"
                          >
                            <Clock className="size-3.5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={actionLoadingId === a.id}
                          onClick={() => handleDelete(a)}
                          title="Delete Assignment"
                          className="size-8 rounded-xl text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
