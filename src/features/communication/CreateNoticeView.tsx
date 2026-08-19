import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  FileText,
  ArrowLeft,
  Calendar,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createNotice } from "@/services/communicationService";
import { getSchoolClasses, getSections } from "@/services/academicService";
import { noticeSchema, type NoticeInput } from "@/schemas/communication";
import type { SchoolClass, Section } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CreateNoticeView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<NoticeInput>({
    resolver: zodResolver(noticeSchema),
    defaultValues: {
      title: "",
      category: "General",
      content: "",
      audienceType: "Entire School",
      publishDate: today,
      issuedBy: userProfile?.name ? `${userProfile.name} (Principal / Admin)` : "Office of the Principal",
      signatureTitle: "Principal / Authorised Signatory",
      status: "Published",
    },
  });

  const selectedAudience = form.watch("audienceType");
  const selectedClassId = form.watch("targetClassId");

  useEffect(() => {
    if (!organization) return;
    getSchoolClasses(organization.id).then(setClasses).catch(console.error);
  }, [organization]);

  useEffect(() => {
    if (!organization || !selectedClassId) {
      setSections([]);
      return;
    }
    getSections(organization.id, selectedClassId).then(setSections).catch(console.error);
  }, [organization, selectedClassId]);

  const onSubmit = async (data: NoticeInput) => {
    if (!organization || !firebaseUser) {
      setErrorMsg("You must be logged in to issue a notice.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createNotice(organization.id, data, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      navigate({ to: "/communication/notices" });
    } catch (err: any) {
      console.error("Notice creation error:", err);
      setErrorMsg(err.message || "Failed to create formal notice.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/communication/notices">
            <ArrowLeft className="size-3.5 mr-1" /> Back to Notices
          </Link>
        </Button>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <FileText className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground">Issue Formal Administrative Notice</h1>
              <p className="text-xs text-muted-foreground">Official school memo with automated numbering, print format, and digital signature header.</p>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Title & Category */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2 space-y-1.5">
              <Label className="text-xs font-bold">Notice Subject / Title *</Label>
              <Input
                {...form.register("title")}
                placeholder="e.g. Schedule for Half-Yearly Parent Teacher Meeting (PTM)"
                className="h-10 text-xs rounded-xl"
              />
              {form.formState.errors.title && (
                <p className="text-[10px] text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Category *</Label>
              <select
                {...form.register("category")}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Academic">Academic</option>
                <option value="Holiday">Holiday</option>
                <option value="Exam">Exam</option>
                <option value="Fee">Fee</option>
                <option value="Attendance">Attendance</option>
                <option value="Event">Event</option>
                <option value="General">General</option>
                <option value="Emergency">Emergency</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          {/* Audience & Dates */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Target Audience *</Label>
              <select
                {...form.register("audienceType")}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Entire School">Entire School</option>
                <option value="Students">Students</option>
                <option value="Parents">Parents</option>
                <option value="Teachers">Teachers</option>
                <option value="Staff">Staff</option>
                <option value="Specific Class">Specific Class</option>
                <option value="Specific Section">Specific Section</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Publish Date *</Label>
              <Input
                type="date"
                {...form.register("publishDate")}
                className="h-10 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Expiry Date (Optional)</Label>
              <Input
                type="date"
                {...form.register("expiryDate")}
                className="h-10 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Conditional Specific Class / Section */}
          {(selectedAudience === "Specific Class" || selectedAudience === "Specific Section") && (
            <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-border bg-surface/50 p-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Select Class *</Label>
                <select
                  {...form.register("targetClassId")}
                  className="h-9 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground"
                >
                  <option value="">Select Academic Class</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              {selectedAudience === "Specific Section" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Select Section</Label>
                  <select
                    {...form.register("targetSectionId")}
                    className="h-9 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground"
                  >
                    <option value="">All Sections</option>
                    {sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Notice Content */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Notice Body & Details *</Label>
            <textarea
              {...form.register("content")}
              rows={6}
              placeholder="Type the formal official notice text here..."
              className="w-full rounded-2xl border border-input bg-surface p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {form.formState.errors.content && (
              <p className="text-[10px] text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Signatory & Issuance Details */}
          <div className="grid gap-4 sm:grid-cols-2 rounded-2xl border border-border bg-surface/50 p-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Issued By (Name & Designation) *</Label>
              <Input
                {...form.register("issuedBy")}
                placeholder="e.g. Dr. Rajesh Sharma (Principal)"
                className="h-9 text-xs rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Signature Line / Authority</Label>
              <Input
                {...form.register("signatureTitle")}
                placeholder="e.g. Principal / Authorised Signatory"
                className="h-9 text-xs rounded-xl"
              />
            </div>
          </div>

          {/* Submission Status Toggle */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  value="Published"
                  {...form.register("status")}
                  className="text-primary focus:ring-primary"
                />
                <span>Publish Immediately</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  value="Draft"
                  {...form.register("status")}
                  className="text-primary focus:ring-primary"
                />
                <span>Save as Draft</span>
              </label>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/communication/notices">Cancel</Link>
            </Button>
            <Button
              type="submit"
              variant="hero"
              size="sm"
              disabled={isSubmitting}
              className="rounded-xl text-xs font-bold shadow-soft"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Saving Notice...
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5 mr-1.5" /> Save & Issue Notice
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
