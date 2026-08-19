import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CommunicationDashboardView } from "@/features/communication";

export const Route = createFileRoute("/communication/")({
  head: () => ({
    meta: [
      { title: "Communication Dashboard — InSuite" },
      { name: "description", content: "School broadcasts, notices, and outbox analytics." },
    ],
  }),
  component: CommunicationDashboardPage,
});

function CommunicationDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CommunicationDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
