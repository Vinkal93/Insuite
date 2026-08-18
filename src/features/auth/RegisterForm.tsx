import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { registerSchema, type RegisterInput } from "@/schemas";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const RegisterForm: React.FC = () => {
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshUserData } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      const userCred = await createUserWithEmailAndPassword(auth, data.email, data.password);
      await updateProfile(userCred.user, { displayName: data.displayName });
      await refreshUserData();
      window.location.href = "/setup";
    } catch (err: any) {
      console.error("Registration failed:", err);
      if (err.code === "auth/email-already-in-use") {
        setAuthError("An account with this email already exists. Please sign in.");
      } else if (err.code === "auth/weak-password") {
        setAuthError("Password is too weak. Use at least 6 characters with mixed letters/numbers.");
      } else {
        setAuthError(err.message || "Failed to create account. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {authError && (
        <div className="flex items-center gap-2.5 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive">
          <AlertCircle className="size-4 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="displayName" className="text-xs font-semibold">
          Your Full Name
        </Label>
        <Input
          id="displayName"
          type="text"
          placeholder="e.g. Dr. Rajesh Sharma"
          {...register("displayName")}
          className="rounded-xl border-border bg-card text-xs"
        />
        {errors.displayName && (
          <p className="text-[11px] font-medium text-destructive">{errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="text-xs font-semibold">
          Official Email Address
        </Label>
        <Input
          id="email"
          type="email"
          placeholder="admin@school.com"
          {...register("email")}
          className="rounded-xl border-border bg-card text-xs"
        />
        {errors.email && (
          <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-xs font-semibold">
          Password
        </Label>
        <Input
          id="password"
          type="password"
          placeholder="Minimum 6 characters"
          {...register("password")}
          className="rounded-xl border-border bg-card text-xs"
        />
        {errors.password && (
          <p className="text-[11px] font-medium text-destructive">{errors.password.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword" className="text-xs font-semibold">
          Confirm Password
        </Label>
        <Input
          id="confirmPassword"
          type="password"
          placeholder="Re-enter password"
          {...register("confirmPassword")}
          className="rounded-xl border-border bg-card text-xs"
        />
        {errors.confirmPassword && (
          <p className="text-[11px] font-medium text-destructive">{errors.confirmPassword.message}</p>
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
            <Loader2 className="size-4 animate-spin mr-2" /> Creating School Account...
          </>
        ) : (
          <>
            Continue to School Setup <ArrowRight className="size-4 ml-1.5" />
          </>
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        <span>Already have an account? </span>
        <Link to="/login" className="font-semibold text-primary hover:underline">
          Sign In
        </Link>
      </div>
    </form>
  );
};
