import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentDashboardView } from "@/features/documents";

export const Route = createFileRoute("/documents/")({
  head: () => ({
    meta: [
      { title: "Certificates & ID Cards — InSuite" },
      { name: "description", content: "Document generation, certificate templates, and QR verification." },
    ],
  }),
  component: DocumentDashboardPage,
});

function DocumentDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
