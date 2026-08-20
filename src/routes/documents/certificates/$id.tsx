import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CertificateDetailView } from "@/features/documents";

export const Route = createFileRoute("/documents/certificates/$id")({
  head: () => ({
    meta: [
      { title: "Certificate View & Print — InSuite" },
      { name: "description", content: "Official certificate view and print sheet." },
    ],
  }),
  component: CertificateDetailPage,
});

function CertificateDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CertificateDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
