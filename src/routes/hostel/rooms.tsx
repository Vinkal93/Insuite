import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelRoomsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/rooms")({
  head: () => ({
    meta: [
      { title: "Hostel Rooms — InSuite" },
      { name: "description", content: "Configure hostel rooms and capacities." },
    ],
  }),
  component: HostelRoomsPage,
});

function HostelRoomsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelRoomsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
