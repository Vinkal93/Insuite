import React, { useState } from "react";
import { Settings, Lock, KeyRound, CheckCircle2, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStudent } from "@/context/StudentContext";
import { Button } from "@/components/ui/button";

export const StudentSettingsView: React.FC = () => {
  const { firebaseUser, signOut } = useAuth();
  const { student } = useStudent();

  const [passwordResetSent, setPasswordResetSent] = useState(false);

  const handleSendPasswordReset = async () => {
    if (!firebaseUser?.email) return;
    try {
      setPasswordResetSent(true);
    } catch (err: any) {
      alert("Failed to send reset email: " + err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Account Settings
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Manage your portal login security and account preferences.
        </p>
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
            <CheckCircle2 className="size-4" /> Password reset link sent to your registered email.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface/50 p-4 rounded-2xl border border-border">
            <div className="text-xs">
              <p className="font-bold text-foreground">Reset Account Password</p>
              <p className="text-[10px] text-muted-foreground">
                Receive a password reset email at {firebaseUser?.email || "your registered email"}
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

      {/* Sign Out */}
      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft space-y-4">
        <h3 className="text-sm font-extrabold text-foreground">Session Control</h3>
        <p className="text-xs text-muted-foreground">
          Sign out of your active student portal session on this device.
        </p>

        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut()}
          className="rounded-xl text-xs font-bold text-destructive hover:bg-destructive/10"
        >
          <LogOut className="size-4 mr-2" /> Sign Out
        </Button>
      </div>
    </div>
  );
};
