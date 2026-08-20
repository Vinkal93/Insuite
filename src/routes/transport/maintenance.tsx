import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { MaintenanceListView } from "@/features/transport";

export const Route = createFileRoute("/transport/maintenance")({
  head: () => ({
    meta: [
      { title: "Fleet Maintenance — InSuite" },
      { name: "description", content: "Vehicle servicing, repair logs, parts replacement, and expense records." },
    ],
  }),
  component: MaintenanceListPage,
});

function MaintenanceListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <MaintenanceListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
