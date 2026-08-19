import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/schemas";
import { Loader2, AlertCircle, CheckCircle2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const ForgotPasswordForm: React.FC = () => {
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    setIsSubmitting(true);
    setStatus("idle");
    setErrorMessage(null);

    try {
      await sendPasswordResetEmail(auth, data.email);
      // Always show generic success to protect email enumeration
      setStatus("success");
    } catch (err: any) {
      console.error("Password reset error:", err);
      // For network errors or rate limit, show safe error message
      if (err.code === "auth/network-request-failed") {
        setStatus("error");
        setErrorMessage("Network error. Please check your internet connection.");
      } else if (err.code === "auth/too-many-requests") {
        setStatus("error");
        setErrorMessage("Too many requests. Please wait a few moments and try again.");
      } else {
        // Generic success to prevent account enumeration
        setStatus("success");
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
          <h3 className="text-base font-bold text-foreground">Password Reset Link Sent</h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            If an account exists for this email, a password reset link has been sent. Please check your inbox and spam folder.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild className="w-full rounded-xl">
          <Link to="/login">
            <ArrowLeft className="size-3.5 mr-1.5" /> Back to Sign In
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
        <Label htmlFor="email" className="text-xs font-semibold">
          Registered Email Address
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            placeholder="admin@school.com"
            {...register("email")}
            className="rounded-xl border-border bg-card text-xs pl-9"
          />
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        </div>
        {errors.email && (
          <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="hero"
        size="lg"
        disabled={isSubmitting}
        className="w-full rounded-xl font-bold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="size-4 animate-spin mr-2" /> Sending Reset Link...
          </>
        ) : (
          "Send Reset Link"
        )}
      </Button>

      <div className="pt-2 text-center text-xs">
        <Link to="/login" className="inline-flex items-center gap-1 font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> Back to Sign In
        </Link>
      </div>
    </form>
  );
};
