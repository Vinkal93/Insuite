import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentReportsView } from "@/features/documents";

export const Route = createFileRoute("/documents/reports")({
  head: () => ({
    meta: [
      { title: "Document Reports — InSuite" },
      { name: "description", content: "Document issuance audits and reports." },
    ],
  }),
  component: DocumentReportsPage,
});

function DocumentReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
