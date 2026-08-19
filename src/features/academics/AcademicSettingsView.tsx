import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  GraduationCap,
  Layers,
  BookOpen,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Plus,
  Trash2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { academicSettingsSchema, type AcademicSettingsInput } from "@/schemas";
import { getAcademicSettings, updateAcademicSettings } from "@/services";
import type { AcademicSettingsConfig } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const AcademicSettingsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom arrays state
  const [subjectTypes, setSubjectTypes] = useState<string[]>([
    "Core",
    "Elective",
    "Optional",
    "Language",
    "Practical",
    "Other",
  ]);
  const [newSubjectType, setNewSubjectType] = useState("");

  const [departments, setDepartments] = useState<string[]>([
    "Mathematics",
    "Science",
    "English & Literature",
    "Social Studies & Humanities",
    "Hindi & Regional Languages",
    "Computer Science & IT",
    "Arts & Crafts",
    "Physical Education",
  ]);
  const [newDepartment, setNewDepartment] = useState("");

  const [designations, setDesignations] = useState<string[]>([
    "Principal",
    "Vice Principal",
    "Headmaster / Headmistress",
    "PGT (Post Graduate Teacher)",
    "TGT (Trained Graduate Teacher)",
    "PRT (Primary Teacher)",
    "Assistant Teacher",
    "Special Educator",
    "Lab Assistant",
    "Librarian",
    "Physical Education Trainer",
  ]);
  const [newDesignation, setNewDesignation] = useState("");

  const form = useForm<AcademicSettingsInput>({
    resolver: zodResolver(academicSettingsSchema),
    defaultValues: {
      classCodeFormat: "NUMERIC",
      defaultSectionCapacity: 40,
      sectionCodeFormat: "ALPHA",
      subjectTypes: ["Core", "Elective", "Optional", "Language", "Practical", "Other"],
      defaultMaximumMarks: 100,
      defaultPassingMarks: 33,
      employeeIdFormat: "TCH-YYYY-XXXX",
      defaultDesignations: [
        "Principal",
        "Vice Principal",
        "Headmaster / Headmistress",
        "PGT (Post Graduate Teacher)",
        "TGT (Trained Graduate Teacher)",
        "PRT (Primary Teacher)",
        "Assistant Teacher",
        "Special Educator",
        "Lab Assistant",
        "Librarian",
        "Physical Education Trainer",
      ],
      defaultDepartments: [
        "Mathematics",
        "Science",
        "English & Literature",
        "Social Studies & Humanities",
        "Hindi & Regional Languages",
        "Computer Science & IT",
        "Arts & Crafts",
        "Physical Education",
      ],
      sessionNamingFormat: "YYYY-YY",
    },
  });

  useEffect(() => {
    if (!organization) return;
    getAcademicSettings(organization.id).then((sett) => {
      form.reset({
        classCodeFormat: sett.classCodeFormat || "NUMERIC",
        defaultSectionCapacity: sett.defaultSectionCapacity || 40,
        sectionCodeFormat: sett.sectionCodeFormat || "ALPHA",
        subjectTypes: sett.subjectTypes || [],
        defaultMaximumMarks: sett.defaultMaximumMarks || 100,
        defaultPassingMarks: sett.defaultPassingMarks || 33,
        employeeIdFormat: sett.employeeIdFormat || "TCH-YYYY-XXXX",
        defaultDesignations: sett.defaultDesignations || [],
        defaultDepartments: sett.defaultDepartments || [],
        sessionNamingFormat: sett.sessionNamingFormat || "YYYY-YY",
      });
      if (sett.subjectTypes) setSubjectTypes(sett.subjectTypes);
      if (sett.defaultDepartments) setDepartments(sett.defaultDepartments);
      if (sett.defaultDesignations) setDesignations(sett.defaultDesignations);
    });
  }, [organization]);

  const onAddSubjectType = () => {
    if (newSubjectType.trim() && !subjectTypes.includes(newSubjectType.trim())) {
      const updated = [...subjectTypes, newSubjectType.trim()];
      setSubjectTypes(updated);
      form.setValue("subjectTypes", updated);
      setNewSubjectType("");
    }
  };

  const onRemoveSubjectType = (t: string) => {
    const updated = subjectTypes.filter((x) => x !== t);
    setSubjectTypes(updated);
    form.setValue("subjectTypes", updated);
  };

  const onAddDepartment = () => {
    if (newDepartment.trim() && !departments.includes(newDepartment.trim())) {
      const updated = [...departments, newDepartment.trim()];
      setDepartments(updated);
      form.setValue("defaultDepartments", updated);
      setNewDepartment("");
    }
  };

  const onRemoveDepartment = (d: string) => {
    const updated = departments.filter((x) => x !== d);
    setDepartments(updated);
    form.setValue("defaultDepartments", updated);
  };

  const onAddDesignation = () => {
    if (newDesignation.trim() && !designations.includes(newDesignation.trim())) {
      const updated = [...designations, newDesignation.trim()];
      setDesignations(updated);
      form.setValue("defaultDesignations", updated);
      setNewDesignation("");
    }
  };

  const onRemoveDesignation = (des: string) => {
    const updated = designations.filter((x) => x !== des);
    setDesignations(updated);
    form.setValue("defaultDesignations", updated);
  };

  const onSubmit = async (data: AcademicSettingsInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateAcademicSettings(
        organization.id,
        {
          ...data,
          subjectTypes,
          defaultDepartments: departments,
          defaultDesignations: designations,
        },
        firebaseUser.uid
      );
      setSuccessMsg("Academic settings and configurations updated successfully.");
    } catch (err: any) {
      console.error("Update settings error:", err);
      setErrorMsg(err.message || "Failed to update settings");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Academic Configuration & Settings
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure grading defaults, naming formats, departments, and custom academic rules.
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-success/20 bg-success/10 p-4 text-xs text-success">
          <CheckCircle2 className="size-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Class & Section Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <GraduationCap className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Class & Section Architecture Defaults
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="defaultSectionCapacity" className="text-xs font-semibold">
                Default Section Student Capacity
              </Label>
              <Input
                id="defaultSectionCapacity"
                type="number"
                {...form.register("defaultSectionCapacity")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="classCodeFormat" className="text-xs font-semibold">
                Class Code Scheme
              </Label>
              <select
                id="classCodeFormat"
                {...form.register("classCodeFormat")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="NUMERIC">Numeric (e.g. 10, 11, 12)</option>
                <option value="ALPHANUMERIC">Alphanumeric (e.g. G10, CL-10)</option>
                <option value="ROMAN">Roman (e.g. X, XI, XII)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sectionCodeFormat" className="text-xs font-semibold">
                Section Code Scheme
              </Label>
              <select
                id="sectionCodeFormat"
                {...form.register("sectionCodeFormat")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALPHA">Alphabetic (A, B, C, D)</option>
                <option value="COLOR">Color Batches (Red, Blue, Green)</option>
                <option value="NUMERIC">Numeric (1, 2, 3)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Subject & Marks Evaluation Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <BookOpen className="size-4 text-emerald-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Curriculum & Examination Scheme Defaults
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="defaultMaximumMarks" className="text-xs font-semibold">
                Default Maximum Subject Marks
              </Label>
              <Input
                id="defaultMaximumMarks"
                type="number"
                {...form.register("defaultMaximumMarks")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="defaultPassingMarks" className="text-xs font-semibold">
                Default Passing Marks Minimum
              </Label>
              <Input
                id="defaultPassingMarks"
                type="number"
                {...form.register("defaultPassingMarks")}
                className="rounded-xl border-border bg-surface text-xs font-bold text-emerald-600"
              />
            </div>
          </div>

          {/* Subject Types Manager */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold">Configurable Subject Classifications</Label>
            <div className="flex flex-wrap gap-2">
              {subjectTypes.map((st) => (
                <span
                  key={st}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1 text-xs font-bold text-foreground"
                >
                  {st}
                  <button
                    type="button"
                    onClick={() => onRemoveSubjectType(st)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1 max-w-sm">
              <Input
                value={newSubjectType}
                onChange={(e) => setNewSubjectType(e.target.value)}
                placeholder="New type (e.g. Vocational)"
                className="rounded-xl border-border bg-surface text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={onAddSubjectType} className="rounded-xl text-xs">
                <Plus className="size-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>

        {/* Teacher & Staff Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Users className="size-4 text-blue-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Faculty & Employee Settings
            </h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="employeeIdFormat" className="text-xs font-semibold">
              Employee ID Sequence Format
            </Label>
            <Input
              id="employeeIdFormat"
              {...form.register("employeeIdFormat")}
              className="rounded-xl border-border bg-surface font-mono text-xs font-bold"
            />
          </div>

          {/* Departments Manager */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold">Academic Faculty Departments</Label>
            <div className="flex flex-wrap gap-2">
              {departments.map((dept) => (
                <span
                  key={dept}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1 text-xs font-bold text-foreground"
                >
                  {dept}
                  <button
                    type="button"
                    onClick={() => onRemoveDepartment(dept)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1 max-w-sm">
              <Input
                value={newDepartment}
                onChange={(e) => setNewDepartment(e.target.value)}
                placeholder="e.g. Robotics & AI"
                className="rounded-xl border-border bg-surface text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={onAddDepartment} className="rounded-xl text-xs">
                <Plus className="size-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>

          {/* Designations Manager */}
          <div className="space-y-2 pt-2">
            <Label className="text-xs font-semibold">Teacher Designations</Label>
            <div className="flex flex-wrap gap-2">
              {designations.map((des) => (
                <span
                  key={des}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-surface px-3 py-1 text-xs font-bold text-foreground"
                >
                  {des}
                  <button
                    type="button"
                    onClick={() => onRemoveDesignation(des)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2 pt-1 max-w-sm">
              <Input
                value={newDesignation}
                onChange={(e) => setNewDesignation(e.target.value)}
                placeholder="e.g. Activity Coordinator"
                className="rounded-xl border-border bg-surface text-xs"
              />
              <Button type="button" variant="outline" size="sm" onClick={onAddDesignation} className="rounded-xl text-xs">
                <Plus className="size-3.5 mr-1" /> Add
              </Button>
            </div>
          </div>
        </div>

        {/* Academic Session Calendar Settings */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Calendar className="size-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Session Calendar Settings
            </h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="sessionNamingFormat" className="text-xs font-semibold">
              Session Naming Format
            </Label>
            <select
              id="sessionNamingFormat"
              {...form.register("sessionNamingFormat")}
              className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="YYYY-YY">YYYY-YY (e.g. 2026-27)</option>
              <option value="YYYY-YYYY">YYYY-YYYY (e.g. 2026-2027)</option>
              <option value="YYYY">Single Year YYYY (e.g. 2026)</option>
            </select>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold shadow-soft">
            {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-3.5 mr-1.5" />}
            Save Academic Settings
          </Button>
        </div>
      </form>
    </div>
  );
};
