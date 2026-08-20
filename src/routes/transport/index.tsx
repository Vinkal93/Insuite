import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TransportDashboardView } from "@/features/transport";

export const Route = createFileRoute("/transport/")({
  head: () => ({
    meta: [
      { title: "Transport Command Center — InSuite" },
      { name: "description", content: "Fleet operations, routes, drivers, and student transit allocations." },
    ],
  }),
  component: TransportDashboardPage,
});

function TransportDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TransportDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
