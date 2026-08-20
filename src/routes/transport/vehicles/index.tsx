import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { VehiclesListView } from "@/features/transport";

export const Route = createFileRoute("/transport/vehicles/")({
  head: () => ({
    meta: [
      { title: "Fleet Vehicles — InSuite" },
      { name: "description", content: "School bus fleet, vans, seating capacity, and compliance certificates." },
    ],
  }),
  component: VehiclesListPage,
});

function VehiclesListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <VehiclesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
