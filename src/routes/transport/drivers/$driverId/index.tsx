import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DriverDetailView } from "@/features/transport";

export const Route = createFileRoute("/transport/drivers/$driverId/")({
  head: () => ({
    meta: [
      { title: "Driver Dossier — InSuite" },
      { name: "description", content: "Driver profile, license certification, and route history." },
    ],
  }),
  component: DriverDetailPage,
});

function DriverDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DriverDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
