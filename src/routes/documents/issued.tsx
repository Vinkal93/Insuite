import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { IssuedDocumentsListView } from "@/features/documents";

export const Route = createFileRoute("/documents/issued")({
  head: () => ({
    meta: [
      { title: "Issued Documents Audit — InSuite" },
      { name: "description", content: "Audit ledger of all issued certificates and cards." },
    ],
  }),
  component: IssuedDocumentsPage,
});

function IssuedDocumentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <IssuedDocumentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
