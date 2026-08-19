import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Send,
  ArrowLeft,
  AlertCircle,
  Loader2,
  CheckCircle2,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { sendMessage, getCommunicationSettings } from "@/services/communicationService";
import { getSchoolClasses, getSections } from "@/services/academicService";
import { messageSchema, type MessageInput } from "@/schemas/communication";
import type { SchoolClass, Section } from "@/types";
import type { CommunicationSettingsConfig } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const SendMessageView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const navigate = useNavigate();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [settings, setSettings] = useState<CommunicationSettingsConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<MessageInput>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      channel: "IN_APP",
      audienceType: "Entire School",
      subject: "",
      content: "",
    },
  });

  const selectedChannel = form.watch("channel");
  const selectedAudience = form.watch("audienceType");
  const selectedClassId = form.watch("targetClassId");

  useEffect(() => {
    if (!organization) return;
    Promise.all([
      getSchoolClasses(organization.id),
      getCommunicationSettings(organization.id),
    ])
      .then(([clsList, sett]) => {
        setClasses(clsList);
        setSettings(sett);
      })
      .catch(console.error);
  }, [organization]);

  useEffect(() => {
    if (!organization || !selectedClassId) {
      setSections([]);
      return;
    }
    getSections(organization.id, selectedClassId).then(setSections).catch(console.error);
  }, [organization, selectedClassId]);

  const onSubmit = async (data: MessageInput) => {
    if (!organization || !firebaseUser) {
      setErrorMsg("You must be logged in to dispatch a message.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await sendMessage(organization.id, data, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      navigate({ to: "/communication/messages" });
    } catch (err: any) {
      console.error("Message dispatch error:", err);
      setErrorMsg(err.message || "Failed to dispatch message.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Channel configuration verification badge
  const isChannelConfigured =
    selectedChannel === "IN_APP" ||
    (selectedChannel === "EMAIL" && settings?.providers.email?.isConfigured) ||
    (selectedChannel === "SMS" && settings?.providers.sms?.isConfigured) ||
    (selectedChannel === "WHATSAPP" && settings?.providers.whatsapp?.isConfigured);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs">
          <Link to="/communication/messages">
            <ArrowLeft className="size-3.5 mr-1" /> Back to Outbox
          </Link>
        </Button>
      </div>

      {/* Form Card */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft sm:p-8 space-y-6">
        <div className="border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Send className="size-4" />
            </div>
            <div>
              <h1 className="text-lg font-black text-foreground">Compose & Dispatch Message</h1>
              <p className="text-xs text-muted-foreground">Send targeted notifications through verified delivery channels.</p>
            </div>
          </div>
        </div>

        {/* Unconfigured Channel Warning */}
        {!isChannelConfigured && (
          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs text-amber-800 space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>Channel Integration Required</span>
            </div>
            <p className="text-[11px] text-amber-700">
              The <strong>{selectedChannel}</strong> provider gateway is not configured yet. Dispatches will record an explicit unconfigured status. Configure credentials in{" "}
              <Link to="/communication/settings" className="underline font-bold">
                Communication Settings
              </Link>
              .
            </p>
          </div>
        )}

        {errorMsg && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 flex items-center gap-3 text-xs text-destructive">
            <AlertCircle className="size-4 shrink-0" />
            <p>{errorMsg}</p>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Channel Selector */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Delivery Channel *</Label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { id: "IN_APP", label: "In-App Feed" },
                { id: "EMAIL", label: "Email Gateway" },
                { id: "SMS", label: "SMS Gateway" },
                { id: "WHATSAPP", label: "WhatsApp API" },
              ].map((ch) => {
                const isSelected = selectedChannel === ch.id;
                return (
                  <label
                    key={ch.id}
                    className={`flex flex-col items-center justify-center rounded-2xl border p-3 text-center cursor-pointer transition-all ${
                      isSelected
                        ? "border-primary bg-primary/5 text-primary font-bold shadow-sm"
                        : "border-border bg-surface/50 text-muted-foreground hover:bg-surface"
                    }`}
                  >
                    <input
                      type="radio"
                      value={ch.id}
                      {...form.register("channel")}
                      className="sr-only"
                    />
                    <span className="text-xs">{ch.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Target Audience */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Audience Targeting *</Label>
            <select
              {...form.register("audienceType")}
              className="h-10 w-full rounded-xl border border-input bg-surface px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="Entire School">Entire School</option>
              <option value="Students">All Students</option>
              <option value="Parents">All Parents</option>
              <option value="Teachers">All Teachers</option>
              <option value="Staff">All Non-Teaching Staff</option>
              <option value="Specific Class">Specific Class Students</option>
              <option value="Specific Section">Specific Section Students</option>
            </select>
          </div>

          {/* Specific Class / Section */}
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

          {/* Subject */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Subject Line *</Label>
            <Input
              {...form.register("subject")}
              placeholder="e.g. Urgent Reminder: Fee Due Date"
              className="h-10 text-xs rounded-xl"
            />
            {form.formState.errors.subject && (
              <p className="text-[10px] text-destructive">{form.formState.errors.subject.message}</p>
            )}
          </div>

          {/* Message Content */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold">Message Body *</Label>
            <textarea
              {...form.register("content")}
              rows={5}
              placeholder="Type message content..."
              className="w-full rounded-2xl border border-input bg-surface p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            {form.formState.errors.content && (
              <p className="text-[10px] text-destructive">{form.formState.errors.content.message}</p>
            )}
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
            <Button variant="outline" size="sm" asChild className="rounded-xl text-xs">
              <Link to="/communication/messages">Cancel</Link>
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
                  <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Dispatching...
                </>
              ) : (
                <>
                  <Send className="size-3.5 mr-1.5" /> Dispatch Message
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
