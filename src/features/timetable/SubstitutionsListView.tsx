import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UserCheck,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  AlertCircle,
  Loader2,
  RefreshCw,
  User,
  GraduationCap,
  Layers,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { substitutionSchema, type SubstitutionInput } from "@/schemas";
import {
  getSubstitutions,
  createSubstitution,
  updateSubstitutionStatus,
  getTeachers,
  getSchoolClasses,
  getSections,
  getSubjects,
  getPeriods,
} from "@/services";
import type {
  Substitution,
  SubstitutionStatus,
  Teacher,
  SchoolClass,
  Section,
  Subject,
  Period,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SubstitutionsListView: React.FC = () => {
  const { organization, firebaseUser, userProfile, selectedSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SubstitutionStatus | "all">("Assigned");
  const [substitutionsList, setSubstitutionsList] = useState<Substitution[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [sectionsList, setSectionsList] = useState<Section[]>([]);
  const [subjectsList, setSubjectsList] = useState<Subject[]>([]);
  const [periodsList, setPeriodsList] = useState<Period[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<SubstitutionInput>({
    resolver: zodResolver(substitutionSchema),
    defaultValues: {
      academicSessionId: selectedSession?.id || "",
      date: new Date().toISOString().split("T")[0],
      periodId: "",
      absentTeacherId: "",
      substituteTeacherId: "",
      classId: "",
      sectionId: "",
      subjectId: "",
      reason: "",
      notes: "",
      status: "Assigned",
    },
  });

  const selectedClassId = form.watch("classId");

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [subs, teachers, classes, subjects, periods] = await Promise.all([
        getSubstitutions(
          organization.id,
          activeTab !== "all" ? activeTab : undefined,
          undefined,
          selectedSession?.id
        ),
        getTeachers(organization.id, "active"),
        getSchoolClasses(organization.id, selectedSession?.id),
        getSubjects(organization.id),
        getPeriods(organization.id),
      ]);

      setSubstitutionsList(subs);
      setTeachersList(teachers);
      setClassesList(classes);
      setSubjectsList(subjects);
      setPeriodsList(periods);

      if (classes.length > 0 && !form.getValues("classId")) {
        form.setValue("classId", classes[0].id);
      }
      if (periods.length > 0 && !form.getValues("periodId")) {
        form.setValue("periodId", periods[0].id);
      }
    } catch (err: any) {
      setError(err.message || "Unable to load substitutions.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization, activeTab, selectedSession]);

  useEffect(() => {
    if (!organization || !selectedClassId) return;
    getSections(organization.id, selectedClassId, selectedSession?.id).then((secs) => {
      setSectionsList(secs);
      if (secs.length > 0) {
        form.setValue("sectionId", secs[0].id);
      }
    });
  }, [organization, selectedClassId, selectedSession]);

  const onSaveSubmit = async (data: SubstitutionInput) => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      await createSubstitution(
        organization.id,
        {
          ...data,
          academicSessionId: selectedSession?.id || "",
        },
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );

      setSuccessMsg("Substitution assigned successfully.");
      setIsModalOpen(false);
      form.reset();
      await loadData();
    } catch (err: any) {
      console.error("Create substitution error:", err);
      setError(err.message || "Unable to assign substitution.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (subId: string, newStatus: SubstitutionStatus) => {
    if (!organization || !firebaseUser) return;
    try {
      await updateSubstitutionStatus(
        organization.id,
        subId,
        newStatus,
        firebaseUser.uid,
        userProfile?.displayName || "Admin"
      );
      setSuccessMsg(`Substitution marked as ${newStatus}.`);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Unable to update substitution status.");
    }
  };

  const filteredSubs = substitutionsList.filter((s) => {
    const matchesSearch =
      s.absentTeacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.substituteTeacherName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.subjectName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const tabs: Array<{ id: SubstitutionStatus | "all"; label: string }> = [
    { id: "Assigned", label: "Active Assignments" },
    { id: "Pending", label: "Pending" },
    { id: "Completed", label: "Completed" },
    { id: "Cancelled", label: "Cancelled" },
    { id: "all", label: "All Records" },
  ];

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
            Faculty Substitutions
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Arrange and track substitute teacher allocations when staff members are absent or on leave.
          </p>
        </div>

        <Button
          variant="hero"
          size="sm"
          onClick={() => setIsModalOpen(true)}
          className="rounded-xl text-xs font-bold shadow-soft"
        >
          <Plus className="size-3.5 mr-1" /> Assign Substitution
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
            onClick={loadData}
            className="rounded-xl text-xs font-bold border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      )}

      {/* Tabs */}
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

      {/* Search Toolbar */}
      <div className="flex rounded-2xl border border-border bg-card p-4 shadow-soft">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by teacher, subject, reason..."
            className="pl-9 rounded-xl border-border bg-surface text-xs"
          />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-3xl border border-border bg-card shadow-soft overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground">
            <Loader2 className="mx-auto size-6 animate-spin text-primary" />
            <p className="mt-2 text-xs">Loading substitutions...</p>
          </div>
        ) : filteredSubs.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <UserCheck className="mx-auto size-8 opacity-40" />
            <p className="mt-2 text-xs font-semibold">No substitutions found in this view.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsModalOpen(true)}
              className="mt-4 rounded-xl text-xs"
            >
              + Create Substitution
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border bg-surface/50 text-muted-foreground uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-6 py-3.5 font-bold">Date & Period</th>
                  <th className="px-4 py-3.5 font-bold text-rose-500">Absent Teacher</th>
                  <th className="px-4 py-3.5 font-bold text-emerald-600">Substitute Teacher</th>
                  <th className="px-4 py-3.5 font-bold">Class & Subject</th>
                  <th className="px-4 py-3.5 font-bold">Reason</th>
                  <th className="px-4 py-3.5 font-bold">Status</th>
                  <th className="px-6 py-3.5 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSubs.map((s) => (
                  <tr key={s.id} className="hover:bg-secondary/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-foreground">
                      <p className="font-mono text-xs">{s.date}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold">{s.periodName || "Period"}</p>
                    </td>
                    <td className="px-4 py-4 font-extrabold text-foreground">
                      {s.absentTeacherName}
                    </td>
                    <td className="px-4 py-4 font-extrabold text-emerald-600">
                      {s.substituteTeacherName}
                    </td>
                    <td className="px-4 py-4 text-foreground">
                      <p className="font-bold">{s.className} ({s.sectionName})</p>
                      <p className="text-[10px] text-muted-foreground">{s.subjectName}</p>
                    </td>
                    <td className="px-4 py-4 text-muted-foreground max-w-xs truncate">
                      {s.reason}
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                          s.status === "Completed"
                            ? "bg-success/15 text-success"
                            : s.status === "Assigned"
                            ? "bg-primary/15 text-primary"
                            : s.status === "Pending"
                            ? "bg-amber-500/15 text-amber-500"
                            : "bg-destructive/15 text-destructive"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {s.status === "Assigned" && (
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(s.id, "Completed")}
                            className="rounded-xl text-xs font-semibold text-emerald-600 hover:bg-emerald-500/10"
                          >
                            Mark Done
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStatusChange(s.id, "Cancelled")}
                            className="rounded-xl text-xs font-semibold text-rose-500 hover:bg-rose-500/10"
                          >
                            Cancel
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Assign Substitution Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 shadow-lift sm:p-8">
            <h2 className="text-base font-extrabold tracking-tight text-foreground">
              Assign Teacher Substitution
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Allocates an available faculty member to cover a scheduled class period.
            </p>

            <form onSubmit={form.handleSubmit(onSaveSubmit)} className="mt-5 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="date" className="text-xs font-semibold">Substitution Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    {...form.register("date")}
                    className="rounded-xl border-border bg-surface text-xs font-bold"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="periodId" className="text-xs font-semibold">Select Period *</Label>
                  <select
                    id="periodId"
                    {...form.register("periodId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {periodsList.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.startTime} - {p.endTime})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="absentTeacherId" className="text-xs font-semibold text-rose-500">
                    Absent Teacher *
                  </Label>
                  <select
                    id="absentTeacherId"
                    {...form.register("absentTeacherId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Select Absent Teacher --</option>
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.personal.fullName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.absentTeacherId && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.absentTeacherId.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="substituteTeacherId" className="text-xs font-semibold text-emerald-600">
                    Substitute Teacher *
                  </Label>
                  <select
                    id="substituteTeacherId"
                    {...form.register("substituteTeacherId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Select Substitute --</option>
                    {teachersList.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.personal.fullName} ({t.employeeId})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.substituteTeacherId && (
                    <p className="text-[11px] text-destructive">{form.formState.errors.substituteTeacherId.message}</p>
                  )}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="classId" className="text-xs font-semibold">Class *</Label>
                  <select
                    id="classId"
                    {...form.register("classId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {classesList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="sectionId" className="text-xs font-semibold">Section *</Label>
                  <select
                    id="sectionId"
                    {...form.register("sectionId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    {sectionsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="subjectId" className="text-xs font-semibold">Subject *</Label>
                  <select
                    id="subjectId"
                    {...form.register("subjectId")}
                    className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="">-- Select Subject --</option>
                    {subjectsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason" className="text-xs font-semibold">Reason for Substitution *</Label>
                <Input
                  id="reason"
                  placeholder="e.g. Medical leave, official training duty..."
                  {...form.register("reason")}
                  className="rounded-xl border-border bg-surface text-xs"
                />
                {form.formState.errors.reason && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.reason.message}</p>
                )}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="hero"
                  disabled={isSaving}
                  className="rounded-xl text-xs font-bold shadow-soft"
                >
                  {isSaving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                  Confirm Assignment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
