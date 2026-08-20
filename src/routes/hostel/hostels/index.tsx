import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/hostels/")({
  head: () => ({
    meta: [
      { title: "Hostels — InSuite" },
      { name: "description", content: "Residential hostel buildings and capacities." },
    ],
  }),
  component: HostelsListPage,
});

function HostelsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
