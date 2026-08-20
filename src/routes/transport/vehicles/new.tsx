import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateVehicleView } from "@/features/transport";

export const Route = createFileRoute("/transport/vehicles/new")({
  head: () => ({
    meta: [
      { title: "Register Fleet Vehicle — InSuite" },
      { name: "description", content: "Add a new bus or van to the transport fleet." },
    ],
  }),
  component: CreateVehiclePage,
});

function CreateVehiclePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateVehicleView />
      </AppLayout>
    </ProtectedRoute>
  );
}
