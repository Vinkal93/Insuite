import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TemplatesListView } from "@/features/communication";

export const Route = createFileRoute("/communication/templates")({
  head: () => ({
    meta: [
      { title: "Communication Templates — InSuite" },
      { name: "description", content: "Manage reusable message templates." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TemplatesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
