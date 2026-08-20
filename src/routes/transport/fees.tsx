import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TransportFeesView } from "@/features/transport";

export const Route = createFileRoute("/transport/fees")({
  head: () => ({
    meta: [
      { title: "Transport Billing — InSuite" },
      { name: "description", content: "Transport fee structures and invoicing status." },
    ],
  }),
  component: TransportFeesPage,
});

function TransportFeesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TransportFeesView />
      </AppLayout>
    </ProtectedRoute>
  );
}
