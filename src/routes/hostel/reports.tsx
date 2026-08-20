import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelReportsView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/reports")({
  head: () => ({
    meta: [
      { title: "Hostel Reports — InSuite" },
      { name: "description", content: "Boarding occupancy and room allocation reports." },
    ],
  }),
  component: HostelReportsPage,
});

function HostelReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
