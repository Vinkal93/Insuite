import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  MessageSquare,
  Bell,
  Lock,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  getCommunicationSettings,
  updateCommunicationSettings,
} from "@/services/communicationService";
import {
  communicationSettingsSchema,
  type CommunicationSettingsInput,
} from "@/schemas/communication";
import type { CommunicationSettingsConfig } from "@/types/communication";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const CommunicationSettingsView: React.FC = () => {
  const { organization, firebaseUser, userProfile } = useAuth();
  const [settings, setSettings] = useState<CommunicationSettingsConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const form = useForm<CommunicationSettingsInput>({
    resolver: zodResolver(communicationSettingsSchema),
    defaultValues: {
      enabledChannels: {
        inApp: true,
        email: false,
        sms: false,
        whatsapp: false,
      },
      noticeNumberPrefix: "NTC-2026",
      autoNumberNotices: true,
      noticeCategories: [
        "Academic",
        "Holiday",
        "Exam",
        "Fee",
        "Attendance",
        "Event",
        "General",
        "Emergency",
      ],
    },
  });

  const loadData = async () => {
    if (!organization) return;
    setIsLoading(true);
    try {
      const data = await getCommunicationSettings(organization.id);
      setSettings(data);
      form.reset({
        enabledChannels: data.enabledChannels,
        noticeNumberPrefix: data.noticeNumberPrefix,
        autoNumberNotices: data.autoNumberNotices,
        noticeCategories: data.noticeCategories,
      });
    } catch (err: any) {
      console.error("Error loading settings:", err);
      setErrorMsg("Failed to load settings.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [organization]);

  const onSubmit = async (data: CommunicationSettingsInput) => {
    if (!organization || !firebaseUser) return;
    setIsSaving(true);
    setSavedSuccess(false);
    setErrorMsg(null);
    try {
      await updateCommunicationSettings(organization.id, data, {
        uid: firebaseUser.uid,
        name: userProfile?.name || "Admin",
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      console.error("Failed to update communication settings:", err);
      setErrorMsg(err.message || "Failed to save settings.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-96 rounded-3xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Communication & Channel Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure delivery channels, provider integrations, automated notice numbering, and policies.
        </p>
      </div>

      {savedSuccess && (
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-xs font-bold text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="size-4 text-emerald-600" />
          <span>Communication settings successfully updated.</span>
        </div>
      )}

      {errorMsg && (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive flex items-center gap-2">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Enabled Channels */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">Delivery Channels</h2>
            <p className="text-xs text-muted-foreground">Select active delivery methods across your institution.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/50 p-4 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("enabledChannels.inApp")}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <div>
                <span className="text-xs font-bold text-foreground">In-App Notification Feed</span>
                <p className="text-[11px] text-muted-foreground">Native web & mobile push notification alerts</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/50 p-4 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("enabledChannels.email")}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <div>
                <span className="text-xs font-bold text-foreground">Email Gateway</span>
                <p className="text-[11px] text-muted-foreground">SMTP or SendGrid transactional email service</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/50 p-4 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("enabledChannels.sms")}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <div>
                <span className="text-xs font-bold text-foreground">SMS Gateway</span>
                <p className="text-[11px] text-muted-foreground">Twilio / MSG91 instant phone text alerts</p>
              </div>
            </label>

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-surface/50 p-4 cursor-pointer">
              <input
                type="checkbox"
                {...form.register("enabledChannels.whatsapp")}
                className="mt-0.5 rounded text-primary focus:ring-primary"
              />
              <div>
                <span className="text-xs font-bold text-foreground">WhatsApp Business API</span>
                <p className="text-[11px] text-muted-foreground">Meta Cloud API interactive message delivery</p>
              </div>
            </label>
          </div>
        </div>

        {/* Notice Configuration */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <h2 className="text-sm font-extrabold text-foreground">Notice Numbering & Formats</h2>
            <p className="text-xs text-muted-foreground">Standard prefix and automatic numbering rules for administrative circulars.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold">Notice Number Prefix</Label>
              <Input
                {...form.register("noticeNumberPrefix")}
                placeholder="e.g. NTC-2026"
                className="h-10 text-xs rounded-xl font-mono"
              />
            </div>

            <div className="flex items-center pt-6">
              <label className="flex items-center gap-2.5 text-xs font-bold cursor-pointer">
                <input
                  type="checkbox"
                  {...form.register("autoNumberNotices")}
                  className="rounded text-primary focus:ring-primary"
                />
                <span>Automatically generate notice numbers</span>
              </label>
            </div>
          </div>
        </div>

        {/* Security & Provider Credentials Architecture */}
        <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
          <div className="border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Lock className="size-4 text-primary" />
              <h2 className="text-sm font-extrabold text-foreground">Provider Credentials Architecture</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Production API keys are kept safely in server environment secrets and never exposed in client Firestore reads.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground">Email Service (SMTP / SendGrid)</span>
                <p className="text-[11px] text-muted-foreground">Status: Not configured (Default InSuite Mailer)</p>
              </div>
              <span className="rounded bg-secondary px-2 py-1 text-[10px] font-bold text-muted-foreground">
                Internal Driver
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground">SMS Gateway (Twilio / MSG91)</span>
                <p className="text-[11px] text-muted-foreground">Status: Unconfigured</p>
              </div>
              <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-700">
                Requires Secret
              </span>
            </div>

            <div className="rounded-2xl border border-border bg-surface p-4 flex items-center justify-between">
              <div>
                <span className="font-bold text-foreground">WhatsApp Business API</span>
                <p className="text-[11px] text-muted-foreground">Status: Unconfigured</p>
              </div>
              <span className="rounded bg-amber-500/10 px-2 py-1 text-[10px] font-bold text-amber-700">
                Requires Secret
              </span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={isSaving}
            className="rounded-xl text-xs font-bold shadow-soft"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 mr-1.5 animate-spin" /> Saving Settings...
              </>
            ) : (
              <>
                <CheckCircle2 className="size-3.5 mr-1.5" /> Save Configuration
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};
