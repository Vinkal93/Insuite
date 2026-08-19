import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  GraduationCap,
  ArrowLeft,
  Loader2,
  Calendar,
  Layers,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { examSchema, type ExamInput } from "@/schemas/exams";
import { createExam, getExamSettings } from "@/services/examService";
import { getSchoolClasses } from "@/services/academicService";
import type { SchoolClass } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CreateExamView: React.FC = () => {
  const { organization, selectedSession, userProfile } = useAuth();
  const navigate = useNavigate();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [examTypes, setExamTypes] = useState<string[]>([
    "Unit Test",
    "Periodic Test",
    "Half Yearly",
    "Annual",
    "Pre-Board",
    "Board",
    "Practical",
    "Other",
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ExamInput>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      name: "",
      academicSessionId: selectedSession?.id || "",
      type: "Periodic Test",
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
      description: "",
      status: "Draft",
      classIds: [],
    },
  });

  const selectedClasses = watch("classIds") || [];

  useEffect(() => {
    if (!organization) return;
    Promise.all([
      getSchoolClasses(organization.id),
      getExamSettings(organization.id),
    ])
      .then(([clsList, settings]) => {
        setClasses(clsList);
        if (settings.examTypes?.length) {
          setExamTypes(settings.examTypes);
        }
      })
      .catch((err) => console.error("Error loading exam setup dependencies:", err));
  }, [organization]);

  useEffect(() => {
    if (selectedSession) {
      setValue("academicSessionId", selectedSession.id);
    }
  }, [selectedSession, setValue]);

  const toggleClass = (classId: string) => {
    if (selectedClasses.includes(classId)) {
      setValue(
        "classIds",
        selectedClasses.filter((id) => id !== classId),
        { shouldValidate: true }
      );
    } else {
      setValue("classIds", [...selectedClasses, classId], { shouldValidate: true });
    }
  };

  const selectAllClasses = () => {
    setValue(
      "classIds",
      classes.map((c) => c.id),
      { shouldValidate: true }
    );
  };

  const deselectAllClasses = () => {
    setValue("classIds", [], { shouldValidate: true });
  };

  const onSubmit = async (data: ExamInput) => {
    if (!organization || !userProfile) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await createExam(organization.id, data, {
        uid: userProfile.uid,
        name: userProfile.displayName || "Admin",
      });
      navigate({
        to: "/exams/$examId",
        params: { examId: created.id },
      });
    } catch (err: any) {
      console.error("Create exam error:", err);
      setErrorMsg(err.message || "Failed to create examination.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Top Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/exams/list">
            <ArrowLeft className="size-3.5 mr-1.5" /> Back to Examinations
          </Link>
        </Button>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-2xl bg-primary/10 p-2.5 text-primary">
              <GraduationCap className="size-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-foreground">Create New Examination</h1>
              <p className="text-xs text-muted-foreground">
                Define the examination term, date duration, and target student classes.
              </p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-destructive/20 bg-destructive/5 p-3.5 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Exam Name */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="name" className="text-xs font-bold">
                Examination Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g. Mid-Term Examination 2026-27 / Annual Assessment"
                {...register("name")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {errors.name && (
                <p className="text-[11px] text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Exam Type */}
            <div className="space-y-1.5">
              <Label htmlFor="type" className="text-xs font-bold">
                Examination Type *
              </Label>
              <select
                id="type"
                {...register("type")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {examTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              {errors.type && (
                <p className="text-[11px] text-destructive">{errors.type.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-bold">
                Initial Status
              </Label>
              <select
                id="status"
                {...register("status")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Draft">Draft</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Ongoing">Ongoing</option>
              </select>
            </div>

            {/* Start Date */}
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-bold">
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                {...register("startDate")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {errors.startDate && (
                <p className="text-[11px] text-destructive">{errors.startDate.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-bold">
                End Date *
              </Label>
              <Input
                id="endDate"
                type="date"
                {...register("endDate")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {errors.endDate && (
                <p className="text-[11px] text-destructive">{errors.endDate.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="sm:col-span-2 space-y-1.5">
              <Label htmlFor="description" className="text-xs font-bold">
                Description / Guidelines (Optional)
              </Label>
              <textarea
                id="description"
                rows={3}
                placeholder="Instructions or notes for teachers, examiners, and students..."
                {...register("description")}
                className="w-full rounded-xl border border-border bg-surface p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Target Classes Selection */}
          <div className="space-y-3 rounded-2xl border border-border bg-surface/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs font-bold">Applicable Classes *</Label>
                <p className="text-[11px] text-muted-foreground">
                  Select which grades participate in this examination.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={selectAllClasses}
                  className="h-7 text-[11px] font-semibold"
                >
                  Select All
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllClasses}
                  className="h-7 text-[11px] text-muted-foreground"
                >
                  Clear
                </Button>
              </div>
            </div>

            {errors.classIds && (
              <p className="text-[11px] text-destructive">{errors.classIds.message}</p>
            )}

            {classes.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-2">
                No classes configured in Phase 5 yet. Create classes in Academic Setup first.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 pt-1">
                {classes.map((cls) => {
                  const isChecked = selectedClasses.includes(cls.id);
                  return (
                    <button
                      type="button"
                      key={cls.id}
                      onClick={() => toggleClass(cls.id)}
                      className={`flex items-center justify-between rounded-xl border p-3 text-left text-xs transition-colors ${
                        isChecked
                          ? "border-primary bg-primary/10 font-bold text-primary"
                          : "border-border bg-card text-foreground hover:bg-surface"
                      }`}
                    >
                      <span className="truncate">{cls.name}</span>
                      {isChecked && <CheckCircle2 className="size-4 shrink-0 text-primary" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs font-semibold">
              <Link to="/exams/list">Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 animate-spin mr-1.5" /> Creating Exam...
                </>
              ) : (
                "Save & Configure Subjects →"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
