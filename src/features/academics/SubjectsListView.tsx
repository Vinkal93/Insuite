import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  GraduationCap,
  Users,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getSubjects } from "@/services";
import type { Subject } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SubjectsListView: React.FC = () => {
  const { organization } = useAuth();
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const subs = await getSubjects(organization.id);
      setSubjectsList(subs);
    } catch (err: any) {
      setError(err.message || "Failed to load subjects");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredSubjects = subjectsList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || s.type === typeFilter;
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Subject & Curriculum Directory
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage academic courses, syllabus codes, evaluation marks schemes, and grading rules.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/academics/subjects/new">
            <Plus className="size-3.5 mr-1" /> Add New Subject
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by subject name or code..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Subject Types</option>
            <option value="Core">Core</option>
            <option value="Elective">Elective</option>
            <option value="Optional">Optional</option>
            <option value="Language">Language</option>
            <option value="Practical">Practical</option>
            <option value="Other">Other</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Subjects Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading subjects...</p>
          </div>
        ) : filteredSubjects.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <BookOpen className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No subjects found in curriculum.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/academics/subjects/new">+ Add First Subject</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Subject Name</th>
                  <th className="px-4 py-3.5 font-bold">Code</th>
                  <th className="px-4 py-3.5 font-bold">Type</th>
                  <th className="px-4 py-3.5 font-bold text-center">Max Marks</th>
                  <th className="px-4 py-3.5 font-bold text-center">Pass Marks</th>
                  <th className="px-4 py-3.5 font-bold text-center">Classes</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubjects.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 font-bold text-xs shrink-0">
                          <BookOpen className="size-4" />
                        </div>
                        <Link
                          to="/academics/subjects/$subjectId"
                          params={{ subjectId: s.id }}
                          className="hover:underline text-sm font-extrabold text-foreground"
                        >
                          {s.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-muted-foreground font-semibold">
                      {s.code}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-surface border border-border px-2.5 py-0.5 text-[10px] font-bold">
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-foreground">
                      {s.marks.maximum}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-muted-foreground">
                      {s.marks.passing}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                        {s.assignedClassIds?.length || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          s.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                        <Link to="/academics/subjects/$subjectId" params={{ subjectId: s.id }}>
                          <Eye className="size-3.5 mr-1" /> View Subject →
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
