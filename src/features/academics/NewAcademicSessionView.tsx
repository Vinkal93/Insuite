import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Calendar,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Sparkles,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { academicSessionSchema, type AcademicSessionInput } from "@/schemas";
import { createAcademicSessionFull } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const NewAcademicSessionView: React.FC = () => {
  const { organization, firebaseUser, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<AcademicSessionInput>({
    resolver: zodResolver(academicSessionSchema),
    defaultValues: {
      name: "2027-28",
      startDate: "2027-04-01",
      endDate: "2028-03-31",
      isActive: false,
    },
  });

  const onSubmit = async (data: AcademicSessionInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createAcademicSessionFull(organization.id, data, firebaseUser.uid);
      await refreshUserData();
      navigate({ to: "/academics/sessions" });
    } catch (err: any) {
      console.error("Create session error:", err);
      setErrorMsg(err.message || "Failed to create academic session");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild className="size-9 rounded-xl">
          <Link to="/academics/sessions">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-foreground">
            Create Academic Session
          </h1>
          <p className="text-xs text-muted-foreground">
            Add a new academic year period to your institutional calendar.
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
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold">
              Academic Session Name *
            </Label>
            <Input
              id="name"
              placeholder="e.g. 2027-28 or 2027-2028"
              {...form.register("name")}
              className="rounded-xl border-border bg-surface text-xs font-bold"
            />
            {form.formState.errors.name && (
              <p className="text-[11px] text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="startDate" className="text-xs font-semibold">
                Start Date *
              </Label>
              <Input
                id="startDate"
                type="date"
                {...form.register("startDate")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {form.formState.errors.startDate && (
                <p className="text-[11px] text-destructive">{form.formState.errors.startDate.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="endDate" className="text-xs font-semibold">
                End Date *
              </Label>
              <Input
                id="endDate"
                type="date"
                {...form.register("endDate")}
                className="rounded-xl border-border bg-surface text-xs"
              />
              {form.formState.errors.endDate && (
                <p className="text-[11px] text-destructive">{form.formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 rounded-2xl border border-border bg-surface p-4">
            <Checkbox
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", Boolean(checked))}
            />
            <div className="grid gap-1 leading-none">
              <label
                htmlFor="isActive"
                className="text-xs font-bold leading-none cursor-pointer text-foreground"
              >
                Set as Active Academic Session
              </label>
              <p className="text-[11px] text-muted-foreground">
                Setting this active will automatically deactivate previous active sessions and make this the default session for admissions and students.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border flex items-center justify-end gap-2">
            <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/academics/sessions">Cancel</Link>
            </Button>
            <Button type="submit" variant="hero" disabled={isSubmitting} className="rounded-xl text-xs font-bold">
              {isSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
              Create Session
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
