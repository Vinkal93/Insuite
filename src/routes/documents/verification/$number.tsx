import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentVerificationView } from "@/features/documents";

export const Route = createFileRoute("/documents/verification/$number")({
  head: () => ({
    meta: [
      { title: "Document Verification Details — InSuite" },
      { name: "description", content: "Document verification result." },
    ],
  }),
  component: DocumentVerificationNumberPage,
});

function DocumentVerificationNumberPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentVerificationView />
      </AppLayout>
    </ProtectedRoute>
  );
}
