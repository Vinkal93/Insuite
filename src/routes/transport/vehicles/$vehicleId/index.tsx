import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { VehicleDetailView } from "@/features/transport";

export const Route = createFileRoute("/transport/vehicles/$vehicleId/")({
  head: () => ({
    meta: [
      { title: "Vehicle Dossier — InSuite" },
      { name: "description", content: "Vehicle profile, roadworthiness certificates, and service log." },
    ],
  }),
  component: VehicleDetailPage,
});

function VehicleDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <VehicleDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
