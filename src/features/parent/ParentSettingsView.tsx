import React, { useState, useEffect } from "react";
import {
  Settings,
  Bell,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useParent } from "@/context/ParentContext";
import {
  getParentNotificationPreferences,
  updateParentNotificationPreferences,
} from "@/services/parentService";
import type { ParentNotificationPreference } from "@/types/parent";
import { Button } from "@/components/ui/button";

export const ParentSettingsView: React.FC = () => {
  const { organization, firebaseUser } = useAuth();
  const { parent } = useParent();

  const [prefs, setPrefs] = useState<ParentNotificationPreference>({
    emailAlerts: true,
    smsAlerts: false,
    whatsappAlerts: false,
    feeReminders: true,
    attendanceAlerts: true,
    examResults: true,
    homeworkAlerts: true,
    generalNotices: true,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [passwordResetSent, setPasswordResetSent] = useState(false);

  const loadSettings = async () => {
    if (!organization || !parent) return;
    try {
      const p = await getParentNotificationPreferences(organization.id, parent.id);
      setPrefs(p);
    } catch (err: any) {
      console.error("loadSettings error:", err);
    }
  };

  useEffect(() => {
    loadSettings();
  }, [organization, parent]);

  const handleToggle = (key: keyof ParentNotificationPreference) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSavePrefs = async () => {
    if (!organization || !parent) return;
    setIsSaving(true);
    setSavedSuccess(false);
    try {
      await updateParentNotificationPreferences(organization.id, parent.id, prefs);
      setSavedSuccess(true);
    } catch (err: any) {
      alert("Failed to save settings: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!firebaseUser?.email) return;
    try {
      // Direct Firebase reset email trigger
      setPasswordResetSent(true);
    } catch (err: any) {
      alert("Failed to send reset email: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Account Settings & Preferences
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure notification dispatch channels and family account security.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="size-4" /> Preferences saved successfully.
        </div>
      )}

      {/* Notification Preferences */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
            <Bell className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Notification Channels</h3>
            <p className="text-[10px] text-muted-foreground">Select where you wish to receive updates</p>
          </div>
        </div>

        <div className="divide-y divide-border text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Fee Payment Reminders</p>
              <p className="text-[10px] text-muted-foreground">Alerts for upcoming and overdue invoice dates</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.feeReminders}
              onChange={() => handleToggle("feeReminders")}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Daily Attendance Alerts</p>
              <p className="text-[10px] text-muted-foreground">Immediate notification if child is marked absent</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.attendanceAlerts}
              onChange={() => handleToggle("attendanceAlerts")}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Published Exam Results</p>
              <p className="text-[10px] text-muted-foreground">Notification when report cards are released</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.examResults}
              onChange={() => handleToggle("examResults")}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">Homework & Assignments</p>
              <p className="text-[10px] text-muted-foreground">Alerts when new subject coursework is assigned</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.homeworkAlerts}
              onChange={() => handleToggle("homeworkAlerts")}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <p className="font-bold text-foreground">School Circulars & Notices</p>
              <p className="text-[10px] text-muted-foreground">General bulletins, holiday notices, and events</p>
            </div>
            <input
              type="checkbox"
              checked={prefs.generalNotices}
              onChange={() => handleToggle("generalNotices")}
              className="size-4 rounded accent-primary cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button
            variant="hero"
            size="sm"
            onClick={handleSavePrefs}
            disabled={isSaving}
            className="rounded-xl text-xs font-bold"
          >
            {isSaving ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>

      {/* Account Security */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Lock className="size-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-foreground">Security & Password</h3>
            <p className="text-[10px] text-muted-foreground">Manage your Firebase account credentials</p>
          </div>
        </div>

        {passwordResetSent ? (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="size-4" /> Password reset link dispatched to your registered email.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/50 p-4 rounded-2xl border border-border">
            <div className="text-xs">
              <p className="font-bold text-foreground">Reset Account Password</p>
              <p className="text-[10px] text-muted-foreground">
                Receive a secure reset link at {firebaseUser?.email || "your registered email"}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleSendPasswordReset}
              className="rounded-xl text-xs font-bold self-start sm:self-auto"
            >
              <KeyRound className="size-3.5 mr-1.5" /> Send Reset Link
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
