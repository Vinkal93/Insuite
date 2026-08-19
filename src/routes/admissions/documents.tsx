import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentsVerificationView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/documents")({
  head: () => ({
    meta: [
      { title: "Documents — InSuite" },
      { name: "description", content: "Document verification for applications." },
    ],
  }),
  component: DocumentsPage,
});

function DocumentsPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Documents Verification">
        <DocumentsVerificationView />
      </AppLayout>
    </ProtectedRoute>
  );
}
