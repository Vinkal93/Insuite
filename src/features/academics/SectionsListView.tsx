import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Layers,
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
import {
  getSections,
  getSchoolClasses,
  getAcademicSessionsList,
} from "@/services";
import type { Section, SchoolClass, AcademicSessionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SectionsListView: React.FC = () => {
  const { organization, selectedSession } = useAuth();
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [secs, classes, sessList] = await Promise.all([
        getSections(
          organization.id,
          selectedClassFilter !== "all" ? selectedClassFilter : undefined,
          selectedSession?.id
        ),
        getSchoolClasses(organization.id, selectedSession?.id),
        getAcademicSessionsList(organization.id),
      ]);
      setSectionsList(secs);
      setClassesList(classes);
      setSessions(sessList);
    } catch (err: any) {
      setError(err.message || "Failed to load sections");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, selectedClassFilter, selectedSession]);

  const filteredSections = sectionsList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.className && s.className.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "all" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Section Management
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage classroom batches, capacity thresholds, room allocations, and assigned class teachers.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/academics/sections/new">
            <Plus className="size-3.5 mr-1" /> Add New Section
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
            placeholder="Search by section name, class, room..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Class Filter */}
          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Classes</option>
            {classesList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.code})
              </option>
            ))}
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

      {/* Table & Mobile Responsive Cards */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading sections...</p>
          </div>
        ) : filteredSections.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Layers className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No sections found.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/academics/sections/new">+ Create New Section</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Section Name</th>
                  <th className="px-4 py-3.5 font-bold">Class</th>
                  <th className="px-4 py-3.5 font-bold">Class Teacher</th>
                  <th className="px-4 py-3.5 font-bold">Room</th>
                  <th className="px-4 py-3.5 font-bold text-center">Capacity</th>
                  <th className="px-4 py-3.5 font-bold text-center">Students</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSections.map((sec) => (
                  <tr key={sec.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-2.5">
                        <div className="grid size-8 place-items-center rounded-xl bg-purple-500/10 text-purple-600 font-black text-xs shrink-0">
                          {sec.code}
                        </div>
                        <Link
                          to="/academics/sections/$sectionId"
                          params={{ sectionId: sec.id }}
                          className="hover:underline text-sm font-extrabold text-foreground"
                        >
                          {sec.name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {sec.className || "Class"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {sec.classTeacherName || (
                        <span className="text-amber-500 font-medium text-[11px]">Unassigned</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {sec.room || "—"}
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      <span className="rounded-lg bg-surface border border-border px-2 py-0.5 text-xs">
                        {sec.capacity}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center font-semibold text-foreground">
                      <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-xs font-bold">
                        {sec.studentsCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          sec.status === "active"
                            ? "bg-success/15 text-success"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {sec.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                        <Link to="/academics/sections/$sectionId" params={{ sectionId: sec.id }}>
                          <Eye className="size-3.5 mr-1" /> View Details →
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
