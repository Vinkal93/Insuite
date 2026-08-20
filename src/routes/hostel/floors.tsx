import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelFloorsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/floors")({
  head: () => ({
    meta: [
      { title: "Hostel Floors — InSuite" },
      { name: "description", content: "Manage hostel floor levels." },
    ],
  }),
  component: HostelFloorsPage,
});

function HostelFloorsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelFloorsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
