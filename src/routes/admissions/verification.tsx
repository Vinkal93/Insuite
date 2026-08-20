import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentsVerificationView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/verification")({
  head: () => ({
    meta: [
      { title: "Application Verification — InSuite" },
      { name: "description", content: "Review and verify student admission applications and uploaded documents." },
    ],
  }),
  component: VerificationPage,
});

function VerificationPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentsVerificationView />
      </AppLayout>
    </ProtectedRoute>
  );
}
