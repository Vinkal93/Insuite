import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentVerificationView } from "@/features/documents";

export const Route = createFileRoute("/documents/verification/")({
  head: () => ({
    meta: [
      { title: "Document Verification — InSuite" },
      { name: "description", content: "Verify authenticity of issued certificates and cards." },
    ],
  }),
  component: DocumentVerificationPage,
});

function DocumentVerificationPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentVerificationView />
      </AppLayout>
    </ProtectedRoute>
  );
}
