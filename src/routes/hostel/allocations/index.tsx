import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelAllocationsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/allocations/")({
  head: () => ({
    meta: [
      { title: "Hostel Allocations — InSuite" },
      { name: "description", content: "Bed allotment roster, transfers, and checkout." },
    ],
  }),
  component: HostelAllocationsListPage,
});

function HostelAllocationsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelAllocationsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
