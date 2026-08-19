import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  BookOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { subjectSchema, type SubjectInput } from "@/schemas";
import { createSubject, checkSubjectCodeAvailable } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const NewSubjectView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<SubjectInput>({
    resolver: zodResolver(subjectSchema),
    defaultValues: {
      name: "",
      code: "",
      type: "Core",
      description: "",
      maximumMarks: 100,
      passingMarks: 33,
      theoryMarks: 70,
      practicalMarks: 30,
      status: "active",
    },
  });

  const onSubmit = async (data: SubjectInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const isAvailable = await checkSubjectCodeAvailable(organization.id, data.code);
      if (!isAvailable) {
        form.setError("code", { message: "This subject code already exists." });
        return;
      }

      await createSubject(organization.id, data, firebaseUser.uid);
      navigate({ to: "/academics/subjects" });
    } catch (err: any) {
      console.error("Create subject error:", err);
      setErrorMsg(err.message || "Failed to create subject");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academics/subjects">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Add New Subject
          </h1>
          <p className="text-xs text-muted-foreground">
            Configure curriculum course details, evaluation marks, and theory/practical criteria.
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
              <Label htmlFor="name" className="text-xs font-semibold">
                Subject Name *
              </Label>
              <Input
                id="name"
                placeholder="e.g. Advanced Mathematics"
                {...form.register("name")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
              {form.formState.errors.name && (
                <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="code" className="text-xs font-semibold">
                Subject Code *
              </Label>
              <Input
                id="code"
                placeholder="e.g. MATH-101"
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
              <Label htmlFor="type" className="text-xs font-semibold">
                Subject Classification / Type *
              </Label>
              <select
                id="type"
                {...form.register("type")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Core">Core</option>
                <option value="Elective">Elective</option>
                <option value="Optional">Optional</option>
                <option value="Language">Language</option>
                <option value="Practical">Practical</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-xs font-semibold">
                Status
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

          {/* Marks Scheme Section */}
          <div className="rounded-2xl border border-border bg-surface p-4 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Marks & Examination Structure
            </h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="maximumMarks" className="text-xs font-semibold">
                  Maximum Total Marks *
                </Label>
                <Input
                  id="maximumMarks"
                  type="number"
                  {...form.register("maximumMarks")}
                  className="rounded-xl border-border bg-card text-xs font-bold"
                />
                {form.formState.errors.maximumMarks && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.maximumMarks.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="passingMarks" className="text-xs font-semibold">
                  Passing Marks *
                </Label>
                <Input
                  id="passingMarks"
                  type="number"
                  {...form.register("passingMarks")}
                  className="rounded-xl border-border bg-card text-xs font-bold"
                />
                {form.formState.errors.passingMarks && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.passingMarks.message}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="theoryMarks" className="text-xs font-semibold">
                  Theory Component Marks
                </Label>
                <Input
                  id="theoryMarks"
                  type="number"
                  {...form.register("theoryMarks")}
                  className="rounded-xl border-border bg-card text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="practicalMarks" className="text-xs font-semibold">
                  Practical / Viva Marks
                </Label>
                <Input
                  id="practicalMarks"
                  type="number"
                  {...form.register("practicalMarks")}
                  className="rounded-xl border-border bg-card text-xs"
                />
                {form.formState.errors.practicalMarks && (
                  <p className="text-[11px] text-destructive">{form.formState.errors.practicalMarks.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description" className="text-xs font-semibold">
              Syllabus / Course Description (Optional)
            </Label>
            <Input
              id="description"
              placeholder="e.g. CBSE Grade 10 Mathematics Standard Syllabus"
              {...form.register("description")}
              className="rounded-xl border-border bg-surface text-xs"
            />
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/academics/subjects">Cancel</Link>
            </Button>
            <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create Subject
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
