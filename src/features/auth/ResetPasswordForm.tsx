import React, { useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { confirmPasswordReset } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Eye, EyeOff, Loader2, AlertCircle, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

interface ResetPasswordFormProps {
  oobCode?: string;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ oobCode }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const passwordValue = watch("password") || "";

  // Password strength calculation
  const getPasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 25;
    if (/[A-Z]/.test(pwd)) score += 25;
    if (/[0-9]/.test(pwd)) score += 25;
    if (/[^A-Za-z0-9]/.test(pwd)) score += 25;
    return score;
  };

  const strength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: ResetPasswordInput) => {
    if (!oobCode) {
      setStatus("error");
      setErrorMessage("Invalid or expired password reset link. Please request a new one.");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    try {
      await confirmPasswordReset(auth, oobCode, data.password);
      setStatus("success");
    } catch (err: any) {
      console.error("Password reset confirmation error:", err);
      setStatus("error");
      if (err.code === "auth/invalid-action-code") {
        setErrorMessage("This password reset link is invalid or has expired. Please request a new one.");
      } else if (err.code === "auth/weak-password") {
        setErrorMessage("Password is too weak. Please choose a stronger password.");
      } else {
        setErrorMessage(err.message || "Failed to update password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-5 rounded-2xl border border-success/20 bg-success/5 p-6 text-center">
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-success text-success-foreground shadow-soft">
          <CheckCircle2 className="size-6" />
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Password Updated Successfully</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Your InSuite account password has been reset. You can now sign in with your new credentials.
          </p>
        </div>
        <Button variant="hero" size="lg" asChild className="w-full rounded-xl font-bold shadow-soft">
          <Link to="/login">
            Go to Login <ArrowRight className="size-4 ml-1.5" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold">
          New Password
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            placeholder="At least 8 characters"
            {...register("password")}
            className="rounded-xl border-border bg-card pr-10 text-xs"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="text-[11px] font-medium text-destructive">{errors.password.message}</p>
        )}

        {/* Password Strength Meter */}
        {passwordValue.length > 0 && (
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full rounded-full bg-secondary overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  strength <= 25
                    ? "bg-rose-500 w-1/4"
                    : strength <= 50
                    ? "bg-amber-500 w-2/4"
                    : strength <= 75
                    ? "bg-blue-500 w-3/4"
                    : "bg-emerald-500 w-full"
                }`}
              />
            </div>
            <p className="text-[10px] text-muted-foreground">
              Strength:{" "}
              <span className="font-semibold text-foreground">
                {strength <= 25 ? "Weak" : strength <= 50 ? "Fair" : strength <= 75 ? "Good" : "Strong"}
              </span>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold">
          Confirm New Password
        </Label>
        <div className="relative">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Re-enter password"
            {...register("confirmPassword")}
            className="rounded-xl border-border bg-card pr-10 text-xs"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="text-[11px] font-medium text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="hero"
        size="lg"
        disabled={isSubmitting}
        className="w-full rounded-xl font-bold shadow-soft"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" /> Updating Password...
          </>
        ) : (
          "Reset Password"
        )}
      </Button>

      <div className="pt-2 text-center text-xs">
        <Link to="/login" className="font-medium text-muted-foreground hover:text-foreground">
          Cancel & Return to Sign In
        </Link>
      </div>
    </form>
  );
};
