import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssetMaintenanceListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/maintenance")({
  head: () => ({
    meta: [
      { title: "Asset Maintenance & Servicing — InSuite" },
      { name: "description", content: "Schedule repairs, track servicing status, and log hardware costs." },
    ],
  }),
  component: MaintenancePage,
});

function MaintenancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AssetMaintenanceListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
