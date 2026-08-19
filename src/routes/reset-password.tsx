import { createFileRoute, useSearch } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { ResetPasswordForm } from "@/features/auth";

export const Route = createFileRoute("/reset-password")({
  validateSearch: (search: Record<string, unknown>): { oobCode?: string; mode?: string } => {
    return {
      oobCode: (search.oobCode as string) || (search.apiKey as string) || "",
      mode: (search.mode as string) || "",
    };
  },
  head: () => ({
    meta: [
      { title: "Set New Password — InSuite" },
      { name: "description", content: "Set a new secure password for your InSuite account." },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const search = useSearch({ from: "/reset-password" });

  return (
    <AuthLayout
      title="Set New Password"
      subtitle="Choose a strong, secure password to protect your school management workspace."
    >
      <ResetPasswordForm oobCode={search.oobCode} />
    </AuthLayout>
  );
}
