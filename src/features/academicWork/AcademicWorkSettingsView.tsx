import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  Clock,
  Paperclip,
  Bell,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { academicWorkSettingsSchema, type AcademicWorkSettingsInput } from "@/schemas";
import { getAcademicWorkSettings, updateAcademicWorkSettings } from "@/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const AcademicWorkSettingsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<AcademicWorkSettingsInput>({
    resolver: zodResolver(academicWorkSettingsSchema),
    defaultValues: {
      assignmentDefaults: {
        defaultType: "Homework",
        allowLateSubmission: true,
        gracePeriodHours: 24,
        allowResubmission: true,
      },
      gradingSettings: {
        defaultMaxMarks: 100,
        defaultGradeType: "Marks",
        autoCalculatePercentage: true,
      },
      attachmentSettings: {
        maxFileSizeMB: 10,
        allowedMimeTypes: [
          "application/pdf",
          "image/jpeg",
          "image/png",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
      },
      notificationSettings: {
        notifyOnPublish: true,
        notifyOnGrading: true,
      },
    },
  });

  useEffect(() => {
    if (!organization) return;
    getAcademicWorkSettings(organization.id).then((config) => {
      form.reset(config);
    });
  }, [organization]);

  const onSubmit = async (data: AcademicWorkSettingsInput) => {
    if (!organization || !firebaseUser) return;
    setIsSubmitting(true);
    setSuccessMsg(null);
    setErrorMsg(null);
    try {
      await updateAcademicWorkSettings(organization.id, data, firebaseUser.uid);
      setSuccessMsg("Academic work configuration updated successfully.");
    } catch (err: any) {
      setErrorMsg(err.message || "Unable to save settings.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl text-foreground">
          Academic Work Settings
        </h1>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure default submission policies, late acceptance grace periods, grading defaults, and file attachment thresholds.
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
        {/* Section 1: Submission Policies */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Clock className="size-4 text-primary" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              1. Submission & Deadline Policies
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="allowLate"
                checked={form.watch("assignmentDefaults.allowLateSubmission")}
                onCheckedChange={(checked) =>
                  form.setValue("assignmentDefaults.allowLateSubmission", !!checked)
                }
              />
              <Label htmlFor="allowLate" className="text-xs font-semibold cursor-pointer">
                Allow students to submit work after the scheduled deadline (Marked as LATE)
              </Label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Late Grace Period (Hours)</Label>
                <Input
                  type="number"
                  min={0}
                  {...form.register("assignmentDefaults.gracePeriodHours")}
                  className="rounded-xl border-border bg-surface text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Default Work Type</Label>
                <select
                  {...form.register("assignmentDefaults.defaultType")}
                  className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="Homework">Homework</option>
                  <option value="Classwork">Classwork</option>
                  <option value="Project">Project</option>
                  <option value="Worksheet">Worksheet</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <Checkbox
                id="allowResubmit"
                checked={form.watch("assignmentDefaults.allowResubmission")}
                onCheckedChange={(checked) =>
                  form.setValue("assignmentDefaults.allowResubmission", !!checked)
                }
              />
              <Label htmlFor="allowResubmit" className="text-xs font-semibold cursor-pointer">
                Enable multiple submission attempts when teacher requests corrections
              </Label>
            </div>
          </div>
        </div>

        {/* Section 2: Grading Defaults */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <CheckCircle2 className="size-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              2. Grading Scale Defaults
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Default Maximum Marks</Label>
              <Input
                type="number"
                min={1}
                {...form.register("gradingSettings.defaultMaxMarks")}
                className="rounded-xl border-border bg-surface text-xs font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Default Scale</Label>
              <select
                {...form.register("gradingSettings.defaultGradeType")}
                className="w-full rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Marks">Marks</option>
                <option value="Grade">Letter Grade</option>
                <option value="Percentage">Percentage</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Attachment Constraints */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-border">
            <Paperclip className="size-4 text-amber-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              3. Attachment Limits
            </h2>
          </div>

          <div className="space-y-1.5 max-w-xs">
            <Label className="text-xs font-semibold">Maximum File Size (MB)</Label>
            <Input
              type="number"
              min={1}
              max={50}
              {...form.register("attachmentSettings.maxFileSizeMB")}
              className="rounded-xl border-border bg-surface text-xs font-bold"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 flex justify-end">
          <Button
            type="submit"
            variant="hero"
            disabled={isSubmitting}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSubmitting ? (
              <Loader2 className="size-4 animate-spin mr-2" />
            ) : (
              <Save className="size-3.5 mr-1.5" />
            )}
            Save Configuration
          </Button>
        </div>
      </form>
    </div>
  );
};
