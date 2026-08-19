import { createFileRoute, useSearch, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { LoginForm, RegisterForm } from "@/features/auth";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { mode?: string } => {
    return {
      mode: (search.mode as string) || "login",
    };
  },
  head: () => ({
    meta: [
      { title: "Sign In — InSuite School Management" },
      { name: "description", content: "Sign in to your InSuite school administration portal." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const search = useSearch({ from: "/login" });
  const isRegister = search.mode === "register";
  const { firebaseUser, organization, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && firebaseUser) {
      if (!organization || !organization.setupCompleted) {
        navigate({ to: "/setup" });
      } else {
        navigate({ to: "/dashboard" });
      }
    }
  }, [isLoading, firebaseUser, organization, navigate]);

  if (!isLoading && firebaseUser) {
    return null;
  }

  return (
    <AuthLayout
      title={isRegister ? "Register Your School" : "Sign In to InSuite"}
      subtitle={
        isRegister
          ? "Create an administrator account to set up your school on InSuite."
          : "Enter your institutional email and credentials to continue."
      }
    >
      {isRegister ? <RegisterForm /> : <LoginForm />}
    </AuthLayout>
  );
}
