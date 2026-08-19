import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  GraduationCap,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Layers,
  Users,
  ChevronRight,
  Loader2,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getSchoolClasses,
  getAcademicSessionsList,
} from "@/services";
import type { SchoolClass, AcademicSessionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const ClassesListView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [selectedSessionFilter, setSelectedSessionFilter] = useState<string>(selectedSession?.id || "all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClasses = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [clsList, sessList] = await Promise.all([
        getSchoolClasses(
          organization.id,
          selectedSessionFilter !== "all" ? selectedSessionFilter : undefined
        ),
        getAcademicSessionsList(organization.id),
      ]);
      setClassesList(clsList);
      setSessions(sessList);
    } catch (err: any) {
      setError(err.message || "Failed to load classes");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, [organization, selectedSessionFilter]);

  const filteredClasses = classesList.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Class Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Define grade levels, class codes, sections, and class teacher allocations.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/academics/classes/new">
            <Plus className="size-3.5 mr-1" /> Add New Class
          </Link>
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 shadow-soft sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by class name or code..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Session Selector Filter */}
          {sessions.length > 0 && (
            <select
              value={selectedSessionFilter}
              onChange={(e) => setSelectedSessionFilter(e.target.value)}
              className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="all">All Academic Sessions</option>
              {sessions.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.isActive ? "(Active)" : ""}
                </option>
              ))}
            </select>
          )}

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

      {/* Table & Mobile Responsive Cards */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading classes...</p>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <GraduationCap className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No classes found.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/academics/classes/new">+ Create New Class</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Class Name</th>
                  <th className="px-4 py-3.5 font-bold">Class Code</th>
                  <th className="px-4 py-3.5 font-bold text-center">Sections</th>
                  <th className="px-4 py-3.5 font-bold text-center">Subjects</th>
                  <th className="px-4 py-3.5 font-bold text-center">Students</th>
                  <th className="px-4 py-3.5 font-bold">Class Teacher</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredClasses.map((c) => (
                  <tr key={c.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-xl bg-primary/10 text-primary font-black text-xs shrink-0">
                          {c.code}
                        </div>
                        <Link
                          to="/academics/classes/$classId"
                          params={{ classId: c.id }}
                          className="hover:underline text-sm font-extrabold text-foreground"
                        >
                          {c.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-muted-foreground font-semibold">
                      {c.code}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      <span className="rounded-lg bg-surface border border-border px-2 py-0.5 text-xs">
                        {c.sectionsCount || 1}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      <span className="rounded-lg bg-surface border border-border px-2 py-0.5 text-xs">
                        {c.subjectsCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                        {c.studentsCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {c.classTeacherName || (
                        <span className="text-amber-500 font-medium text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          c.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                        <Link to="/academics/classes/$classId" params={{ classId: c.id }}>
                          <Eye className="size-3.5 mr-1" /> View Class →
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
