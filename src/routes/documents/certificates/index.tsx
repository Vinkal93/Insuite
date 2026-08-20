import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CertificatesListView } from "@/features/documents";

export const Route = createFileRoute("/documents/certificates/")({
  head: () => ({
    meta: [
      { title: "Issued Certificates — InSuite" },
      { name: "description", content: "School bonafide, character, and transfer certificates." },
    ],
  }),
  component: CertificatesPage,
});

function CertificatesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CertificatesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
