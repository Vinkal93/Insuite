import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { GenerateDocumentView } from "@/features/documents";

export const Route = createFileRoute("/documents/generate")({
  head: () => ({
    meta: [
      { title: "Generate Document — InSuite" },
      { name: "description", content: "Issue individual student or staff certificates." },
    ],
  }),
  component: GenerateDocumentPage,
});

function GenerateDocumentPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <GenerateDocumentView />
      </AppLayout>
    </ProtectedRoute>
  );
}
