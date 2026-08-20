import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelBuildingsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/buildings")({
  head: () => ({
    meta: [
      { title: "Hostel Buildings — InSuite" },
      { name: "description", content: "Manage hostel building wings and towers." },
    ],
  }),
  component: HostelBuildingsPage,
});

function HostelBuildingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelBuildingsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
