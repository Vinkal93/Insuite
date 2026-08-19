import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Megaphone,
  ArrowLeft,
  Calendar,
  Layers,
  AlertCircle,
  Loader2,
  Clock,
  Paperclip,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { createAnnouncement } from "@/services/communicationService";
import { getSchoolClasses, getSections } from "@/services/academicService";
import { announcementSchema, type AnnouncementInput } from "@/schemas/communication";
import type { SchoolClass, Section } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CreateAnnouncementView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<AnnouncementInput>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: "",
      content: "",
      audienceType: "Entire School",
      priority: "Normal",
      publishMode: "NOW",
    },
  });

  const selectedAudience = form.watch("audienceType");
  const selectedClassId = form.watch("targetClassId");
  const publishMode = form.watch("publishMode");

  // Load Classes when Specific Class or Section chosen
  useEffect(() => {
    if (!organization) return;
    getSchoolClasses(organization.id).then(setClasses).catch(console.error);
  }, [organization]);

  // Load Sections when Class selected
  useEffect(() => {
    if (!organization || !selectedClassId) {
      setSections([]);
      return;
    }
    getSections(organization.id, selectedClassId).then(setSections).catch(console.error);
  }, [organization, selectedClassId]);

  const onSubmit = async (data: AnnouncementInput) => {
    if (!organization || !firebaseUser) {
      setErrorMsg("You must be logged in to broadcast an announcement.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await createAnnouncement(organization.id, data, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      navigate({ to: "/communication/announcements" });
    } catch (err: any) {
      console.error("Announcement creation error:", err);
      setErrorMsg(err.message || "Failed to create announcement.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Top Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/communication/announcements">
            <ArrowLeft className="size-3.5 mr-1" /> Back to Announcements
          </Link>
        </Button>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Megaphone className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground">Compose Broadcast Announcement</h1>
              <p className="text-xs text-muted-foreground">Publish instantaneous circulars or schedule automated broadcasts.</p>
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
          {/* Title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Announcement Title *</Label>
            <Input
              {...form.register("title")}
              placeholder="e.g. Annual Sports Meet 2026 Guidelines"
              className="h-10 text-xs rounded-xl"
            />
            {form.formState.errors.title && (
              <p className="text-[10px] text-destructive">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Audience & Priority */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Target Audience *</Label>
              <select
                {...form.register("audienceType")}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Entire School">Entire School</option>
                <option value="Students">Students Only</option>
                <option value="Parents">Parents Only</option>
                <option value="Teachers">Teachers Only</option>
                <option value="Staff">Staff Only</option>
                <option value="Specific Class">Specific Class</option>
                <option value="Specific Section">Specific Section</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Priority Level</Label>
              <select
                {...form.register("priority")}
                className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="Normal">Normal</option>
                <option value="Important">Important</option>
                <option value="Urgent">Urgent / Critical</option>
              </select>
            </div>
          </div>

          {/* Conditional Target Class & Section */}
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
                    <option value="">All Sections in Class</option>
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

          {/* Message Content */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Announcement Content / Message *</Label>
            <textarea
              {...form.register("content")}
              rows={5}
              placeholder="Write the full announcement body text here..."
              className="w-full rounded-2xl border border-input bg-surface p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {form.formState.errors.content && (
              <p className="text-[10px] text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Publish Mode & Schedule */}
          <div className="rounded-2xl border border-border bg-surface/50 p-4 space-y-4">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  value="NOW"
                  {...form.register("publishMode")}
                  className="text-primary focus:ring-primary"
                />
                <span>Publish Immediately</span>
              </label>
              <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                <input
                  type="radio"
                  value="SCHEDULED"
                  {...form.register("publishMode")}
                  className="text-primary focus:ring-primary"
                />
                <span>Schedule for Later</span>
              </label>
            </div>

            {publishMode === "SCHEDULED" && (
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Publish Date & Time *</Label>
                  <Input
                    type="datetime-local"
                    {...form.register("publishAt")}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Auto-Expiry Date (Optional)</Label>
                  <Input
                    type="datetime-local"
                    {...form.register("expiresAt")}
                    className="h-9 text-xs rounded-xl"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/communication/announcements">Cancel</Link>
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
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Broadcasting...
                </>
              ) : publishMode === "SCHEDULED" ? (
                <>
                  <Clock className="size-3.5 mr-1.5" /> Schedule Announcement
                </>
              ) : (
                <>
                  <Megaphone className="size-3.5 mr-1.5" /> Broadcast Now
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
