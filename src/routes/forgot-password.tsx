import { createFileRoute } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ForgotPasswordForm } from "@/features/auth";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset Password — InSuite" },
      { name: "description", content: "Reset your InSuite password." },
    ],
  }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset Password"
      subtitle="Enter your registered email address to receive a secure password reset link."
    >
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
