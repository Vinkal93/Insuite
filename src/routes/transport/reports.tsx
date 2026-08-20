import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TransportReportsView } from "@/features/transport";

export const Route = createFileRoute("/transport/reports")({
  head: () => ({
    meta: [
      { title: "Transport Reports — InSuite" },
      { name: "description", content: "Export fleet rosters, passenger manifests, maintenance, and compliance audits." },
    ],
  }),
  component: TransportReportsPage,
});

function TransportReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TransportReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
