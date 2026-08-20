import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelMaintenanceView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/maintenance")({
  head: () => ({
    meta: [
      { title: "Hostel Maintenance — InSuite" },
      { name: "description", content: "Facility repairs, work orders, and asset upkeep." },
    ],
  }),
  component: HostelMaintenancePage,
});

function HostelMaintenancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelMaintenanceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
