import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Layers,
  ArrowLeft,
  Loader2,
  AlertCircle,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sectionSchema, type SectionInput } from "@/schemas";
import {
  createSection,
  checkSectionCodeAvailable,
  getSchoolClasses,
  getTeachers,
  getAcademicSessionsList,
} from "@/services";
import type { SchoolClass, Teacher, AcademicSessionItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const NewSectionView: React.FC = () => {
  const { organization, firebaseUser, selectedSession } = useAuth();
  const navigate = useNavigate();
  const [classesList, setClassesList] = useState<SchoolClass[]>([]);
  const [teachersList, setTeachersList] = useState<Teacher[]>([]);
  const [sessions, setSessions] = useState<AcademicSessionItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<SectionInput>({
    resolver: zodResolver(sectionSchema),
    defaultValues: {
      name: "",
      code: "",
      academicSessionId: selectedSession?.id || "",
      classId: "",
      room: "",
      capacity: 40,
      classTeacherId: null,
      status: "active",
    },
  });

  useEffect(() => {
    if (organization) {
      Promise.all([
        getSchoolClasses(organization.id, selectedSession?.id),
        getTeachers(organization.id, "active"),
        getAcademicSessionsList(organization.id),
      ]).then(([cls, teachers, sess]) => {
        setClassesList(cls);
        setTeachersList(teachers);
        setSessions(sess);

        if (!form.getValues("academicSessionId") && sess.length > 0) {
          const activeSess = sess.find((s) => s.isActive) || sess[0];
          form.setValue("academicSessionId", activeSess.id);
        }
        if (cls.length > 0 && !form.getValues("classId")) {
          form.setValue("classId", cls[0].id);
        }
      });
    }
  }, [organization, selectedSession]);

  const onSubmit = async (data: SectionInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const isAvailable = await checkSectionCodeAvailable(
        organization.id,
        data.classId,
        data.academicSessionId,
        data.code
      );
      if (!isAvailable) {
        form.setError("code", { message: "This section code already exists for this class." });
        return;
      }

      await createSection(organization.id, data, firebaseUser.uid);
      navigate({ to: "/academics/sections" });
    } catch (err: any) {
      console.error("Create section error:", err);
      setErrorMsg(err.message || "Failed to create section");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academics/sections">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Add New Section
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure classroom batch, student capacity, room allocation, and class teacher.
          </p>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="academicSessionId" className="text-xs font-semibold">
                Academic Session *
              </Label>
              <select
                id="academicSessionId"
                {...form.register("academicSessionId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.isActive ? "(Active)" : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="classId" className="text-xs font-semibold">
                Select Class *
              </Label>
              <select
                id="classId"
                {...form.register("classId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Choose Class --</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </select>
              {form.formState.errors.classId && (
                <p className="text-[11px] text-destructive">{form.formState.errors.classId.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-xs font-semibold">
                Section Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g. Section B or Blue Batch"
                {...form.register("name")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Section Code *
              </Label>
              <Input
                id="code"
                placeholder="e.g. B or BLUE"
                {...form.register("code")}
                className="rounded-xl border-border bg-surface text-xs font-mono uppercase font-bold"
              />
              {form.formState.errors.code && (
                <p className="text-[11px] text-destructive">{form.formState.errors.code.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="room" className="text-xs font-semibold">
                Room / Block Allocation (Optional)
              </Label>
              <Input
                id="room"
                placeholder="e.g. Room 204, Science Wing"
                {...form.register("room")}
                className="rounded-xl border-border bg-surface text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="capacity" className="text-xs font-semibold">
                Student Capacity *
              </Label>
              <Input
                id="capacity"
                type="number"
                {...form.register("capacity")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.capacity && (
                <p className="text-[11px] text-destructive">{form.formState.errors.capacity.message}</p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="classTeacherId" className="text-xs font-semibold">
                Assign Class Teacher (Optional)
              </Label>
              <select
                id="classTeacherId"
                {...form.register("classTeacherId")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Assign Later --</option>
                {teachersList.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.personal.fullName} ({t.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                Section Status
              </Label>
              <select
                id="status"
                {...form.register("status")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/academics/sections">Cancel</Link>
            </Button>
            <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create Section
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
