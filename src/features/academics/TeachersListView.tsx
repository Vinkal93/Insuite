import React, { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit,
  Phone,
  Mail,
  GraduationCap,
  BookOpen,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTeachers, getAcademicSettings } from "@/services";
import type { Teacher, AcademicSettingsConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const TeachersListView: React.FC = () => {
  const { organization } = useAuth();
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [settings, setSettings] = useState<AcademicSettingsConfig | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [teachers, sett] = await Promise.all([
        getTeachers(organization.id),
        getAcademicSettings(organization.id),
      ]);
      setTeachersList(teachers);
      setSettings(sett);
    } catch (err: any) {
      setError(err.message || "Failed to load faculty teachers");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const filteredTeachers = teachersList.filter((t) => {
    const matchesSearch =
      t.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.contact.email && t.contact.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.contact.mobile.includes(searchTerm);
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesDept = deptFilter === "all" || t.professional.department === deptFilter;
    return matchesSearch && matchesStatus && matchesDept;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Faculty & Teachers
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Manage teacher profiles, employee records, assigned courses, and classroom allocations.
          </p>
        </div>

        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/academics/teachers/new">
            <Plus className="size-3.5 mr-1" /> Add New Teacher
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
            placeholder="Search by name, employee ID, email, phone..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Department Filter */}
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="all">All Departments</option>
            {settings?.defaultDepartments.map((d) => (
              <option key={d} value={d}>
                {d}
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
            <option value="on_leave">On Leave</option>
            <option value="resigned">Resigned</option>
            <option value="terminated">Terminated</option>
          </select>
        </div>
      </div>

      {/* Teachers Table & Responsive Cards */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading faculty records...</p>
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Users className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No teachers found in directory.</p>
            <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
              <Link to="/academics/teachers/new">+ Register First Teacher</Link>
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Teacher Name</th>
                  <th className="px-4 py-3.5 font-bold">Employee ID</th>
                  <th className="px-4 py-3.5 font-bold">Department</th>
                  <th className="px-4 py-3.5 font-bold">Designation</th>
                  <th className="px-4 py-3.5 font-bold">Contact</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredTeachers.map((t) => (
                  <tr key={t.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <div className="flex items-center gap-3">
                        {t.personal.photoUrl ? (
                          <img src={t.personal.photoUrl} alt={t.personal.fullName} className="size-9 rounded-xl object-cover shrink-0" />
                        ) : (
                          <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary font-black text-xs shrink-0">
                            {t.personal.firstName.charAt(0)}
                          </div>
                        )}
                        <div>
                          <Link
                            to="/academics/teachers/$teacherId"
                            params={{ teacherId: t.id }}
                            className="hover:underline text-sm font-extrabold text-foreground"
                          >
                            {t.personal.fullName}
                          </Link>
                          <p className="text-[10px] text-muted-foreground capitalize">{t.personal.gender}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono font-bold text-foreground">
                      {t.employeeId}
                    </td>
                    <td className="px-4 py-4 font-semibold text-foreground">
                      {t.professional.department || "General"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      {t.professional.designation || "Faculty"}
                    </td>
                    <td className="px-4 py-4 text-muted-foreground">
                      <p className="font-semibold text-foreground">{t.contact.mobile}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.contact.email || "—"}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          t.status === "active"
                            ? "bg-success/15 text-success"
                            : t.status === "on_leave"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs font-semibold">
                        <Link to="/academics/teachers/$teacherId" params={{ teacherId: t.id }}>
                          <Eye className="size-3.5 mr-1" /> View Profile →
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
