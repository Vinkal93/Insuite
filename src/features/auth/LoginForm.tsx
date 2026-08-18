import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { loginSchema, type LoginInput } from "@/schemas";
import { useAuth } from "@/hooks/useAuth";
import { Eye, EyeOff, Loader2, AlertCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export const LoginForm: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { refreshUserData } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginInput) => {
    setIsSubmitting(true);
    setAuthError(null);

    try {
      await setPersistence(
        auth,
        data.rememberMe ? browserLocalPersistence : browserSessionPersistence
      );
      const userCredential = await signInWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      await refreshUserData();
      // Redirect handled by Auth / Router state
      window.location.href = "/dashboard";
    } catch (err: any) {
      console.error("Login failed:", err);
      const errorCode = err.code;
      if (
        errorCode === "auth/invalid-credential" ||
        errorCode === "auth/wrong-password" ||
        errorCode === "auth/user-not-found"
      ) {
        setAuthError("Invalid email or password. Please check your credentials.");
      } else if (errorCode === "auth/user-disabled") {
        setAuthError("This user account has been disabled. Please contact support.");
      } else if (errorCode === "auth/too-many-requests") {
        setAuthError("Too many unsuccessful attempts. Please try again later.");
      } else if (errorCode === "auth/network-request-failed") {
        setAuthError("Network error. Please check your internet connection.");
      } else {
        setAuthError(err.message || "Failed to sign in. Please try again.");
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
        <Label htmlFor="email" className="text-xs font-semibold">
          Email Address
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="admin@school.com"
          {...register("email")}
          className="rounded-xl border-border bg-card text-xs"
        />
        {errors.email && (
          <p className="text-[11px] font-medium text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password" className="text-xs font-semibold">
            Password
          </Label>
          <Link
            to="/forgot-password"
            className="text-[11px] font-medium text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
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
      </div>

      <div className="flex items-center space-x-2 pt-1">
        <Checkbox
          id="rememberMe"
          checked={rememberMe}
          onCheckedChange={(checked) => setValue("rememberMe", !!checked)}
        />
        <label
          htmlFor="rememberMe"
          className="text-xs font-medium text-muted-foreground cursor-pointer"
        >
          Remember me for 30 days
        </label>
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
            <Loader2 className="size-4 animate-spin mr-2" /> Signing in...
          </>
        ) : (
          <>
            Sign In to InSuite <ArrowRight className="size-4 ml-1.5" />
          </>
        )}
      </Button>

      <div className="pt-2 text-center text-xs text-muted-foreground">
        <span>Don't have a school account yet? </span>
        <Link to="/login" search={{ mode: "register" }} className="font-semibold text-primary hover:underline">
          Register new school
        </Link>
      </div>
    </form>
  );
};
