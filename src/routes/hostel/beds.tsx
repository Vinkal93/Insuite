import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelBedsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/beds")({
  head: () => ({
    meta: [
      { title: "Hostel Beds — InSuite" },
      { name: "description", content: "Bed inventory and resident student occupancy." },
    ],
  }),
  component: HostelBedsPage,
});

function HostelBedsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelBedsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
