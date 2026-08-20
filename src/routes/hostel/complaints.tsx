import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelComplaintsView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/complaints")({
  head: () => ({
    meta: [
      { title: "Hostel Complaints — InSuite" },
      { name: "description", content: "Student maintenance and room facility complaints." },
    ],
  }),
  component: HostelComplaintsPage,
});

function HostelComplaintsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelComplaintsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
