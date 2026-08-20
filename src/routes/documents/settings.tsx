import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentSettingsView } from "@/features/documents";

export const Route = createFileRoute("/documents/settings")({
  head: () => ({
    meta: [
      { title: "Document Settings — InSuite" },
      { name: "description", content: "Document number prefixes and default signatories." },
    ],
  }),
  component: DocumentSettingsPage,
});

function DocumentSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
