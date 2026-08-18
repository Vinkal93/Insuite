import { createFileRoute, useSearch } from "@tanstack/react-router";
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

  if (!isLoading && firebaseUser) {
    if (!organization || !organization.setupCompleted) {
      if (typeof window !== "undefined") window.location.href = "/setup";
      return null;
    } else {
      if (typeof window !== "undefined") window.location.href = "/dashboard";
      return null;
    }
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
