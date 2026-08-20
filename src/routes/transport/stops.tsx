import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StopsListView } from "@/features/transport";

export const Route = createFileRoute("/transport/stops")({
  head: () => ({
    meta: [
      { title: "Transport Stops — InSuite" },
      { name: "description", content: "Designated student pickup and drop waypoints." },
    ],
  }),
  component: StopsListPage,
});

function StopsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StopsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
