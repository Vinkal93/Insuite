import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentTemplatesListView } from "@/features/documents";

export const Route = createFileRoute("/documents/templates/")({
  head: () => ({
    meta: [
      { title: "Document Templates — InSuite" },
      { name: "description", content: "Certificate and document template designs." },
    ],
  }),
  component: DocumentTemplatesPage,
});

function DocumentTemplatesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentTemplatesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
