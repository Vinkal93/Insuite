import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelVisitorsView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/visitors")({
  head: () => ({
    meta: [
      { title: "Hostel Visitors — InSuite" },
      { name: "description", content: "Boarding resident visitor logs from front office gates." },
    ],
  }),
  component: HostelVisitorsPage,
});

function HostelVisitorsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelVisitorsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
