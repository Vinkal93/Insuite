import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  ClipboardCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Eye,
  Edit,
  GraduationCap,
  Calendar,
  Clock,
  Filter,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getAssignments,
  getSubmissionsForAssignment,
  getSchoolClasses,
  getSubjects,
} from "@/services";
import type { Assignment, Submission, SchoolClass, Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SubmissionsListView: React.FC<{ onlyNeedsGrading?: boolean }> = ({
  onlyNeedsGrading = false,
}) => {
  const { organization, selectedSession } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(onlyNeedsGrading ? "Needs Grading" : "all");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<
    Array<Submission & { assignmentTitle?: string; className?: string; subjectName?: string; maxMarks?: number }>
  >([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const [selectedClassId, setSelectedClassId] = useState<string>("ALL");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [assigns, cls, subjs] = await Promise.all([
        getAssignments(organization.id, {
          academicSessionId: selectedSession?.id,
          classId: selectedClassId !== "ALL" ? selectedClassId : undefined,
          subjectId: selectedSubjectId !== "ALL" ? selectedSubjectId : undefined,
        }),
        getSchoolClasses(organization.id, selectedSession?.id),
        getSubjects(organization.id),
      ]);

      setAssignments(assigns);
      setClasses(cls);
      setSubjects(subjs);

      // Load submissions for all fetched assignments
      const subPromises = assigns.map(async (a) => {
        const subs = await getSubmissionsForAssignment(organization.id, a.id);
        return subs.map((s) => ({
          ...s,
          assignmentTitle: a.title,
          className: a.className,
          subjectName: a.subjectName,
          maxMarks: a.grading?.maximumMarks || 100,
        }));
      });

      const results = await Promise.all(subPromises);
      setAllSubmissions(results.flat());
    } catch (err: any) {
      console.error("Load submissions error:", err);
      setError(err.message || "Unable to load student submissions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedSession, selectedClassId, selectedSubjectId]);

  const filteredSubmissions = allSubmissions.filter((s) => {
    // Status filter
    if (activeTab === "Needs Grading") {
      if (s.status !== "Submitted" && s.status !== "Late" && s.status !== "Needs Grading") {
        return false;
      }
    } else if (activeTab !== "all" && s.status !== activeTab) {
      return false;
    }

    // Search filter
    const matchSearch =
      s.studentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.assignmentTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentRollNumber?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  const tabs = [
    { id: "all", label: "All Submissions" },
    { id: "Needs Grading", label: "Needs Grading" },
    { id: "Submitted", label: "Submitted" },
    { id: "Late", label: "Late" },
    { id: "Graded", label: "Graded" },
    { id: "Returned", label: "Returned" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            {onlyNeedsGrading ? "Grading Workspace" : "Student Submissions"}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {onlyNeedsGrading
              ? "Review, evaluate marks, and provide teacher feedback for submitted student tasks."
              : "Track student homework and assignment submissions across all grades."}
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="size-4 shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Tabs (only shown if not strictly grading mode) */}
      {!onlyNeedsGrading && (
        <div className="flex flex-wrap gap-2 border-b border-border pb-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "bg-surface text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Search & Filters */}
      <div className="grid gap-3 sm:grid-cols-3 rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="relative sm:col-span-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by student, assignment..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <select
          value={selectedClassId}
          onChange={(e) => setSelectedClassId(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="ALL">All Classes</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

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
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <ClipboardCheck className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No submissions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Student</th>
                  <th className="px-4 py-3.5 font-bold">Assignment</th>
                  <th className="px-4 py-3.5 font-bold">Class & Subject</th>
                  <th className="px-4 py-3.5 font-bold">Submitted At</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-4 py-3.5 font-bold">Score</th>
                  <th className="px-6 py-3.5 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubmissions.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <p>{s.studentName || s.studentId}</p>
                      {s.studentRollNumber && (
                        <p className="text-[10px] text-muted-foreground font-normal">
                          Roll #{s.studentRollNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground max-w-xs truncate">
                      {s.assignmentTitle || s.assignmentId}
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      <p className="font-semibold">{s.className}</p>
                      <p className="text-[10px] text-muted-foreground">{s.subjectName}</p>
                    </td>
                    <td className="px-4 py-4 font-mono text-muted-foreground">
                      <p>{new Date(s.submittedAt).toLocaleDateString()}</p>
                      {s.late && (
                        <span className="rounded bg-rose-500/10 px-1 py-0.5 text-[9px] font-bold text-rose-500">
                          LATE
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          s.status === "Graded"
                            ? "bg-success/15 text-success"
                            : s.status === "Returned"
                            ? "bg-secondary text-muted-foreground"
                            : "bg-amber-500/15 text-amber-500"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-foreground">
                      {s.marks !== undefined ? `${s.marks} / ${s.maxMarks || 100}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
                        <Link
                          to="/academic-work/submissions/$submissionId"
                          params={{ submissionId: s.id }}
                          search={{ assignmentId: s.assignmentId }}
                        >
                          Grade / Inspect
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
    </div>
  );
};
