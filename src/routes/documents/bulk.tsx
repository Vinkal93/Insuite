import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { BulkGenerationView } from "@/features/documents";

export const Route = createFileRoute("/documents/bulk")({
  head: () => ({
    meta: [
      { title: "Bulk Certificate Generation — InSuite" },
      { name: "description", content: "Bulk generate class certificates." },
    ],
  }),
  component: BulkGenerationPage,
});

function BulkGenerationPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <BulkGenerationView />
      </AppLayout>
    </ProtectedRoute>
  );
}
