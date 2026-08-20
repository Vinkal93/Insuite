import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { EditVehicleView } from "@/features/transport";

export const Route = createFileRoute("/transport/vehicles/$vehicleId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Fleet Vehicle — InSuite" },
      { name: "description", content: "Update vehicle specifications, capacity, and operational status." },
    ],
  }),
  component: EditVehiclePage,
});

function EditVehiclePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <EditVehicleView />
      </AppLayout>
    </ProtectedRoute>
  );
}
