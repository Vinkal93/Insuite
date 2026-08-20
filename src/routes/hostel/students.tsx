import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelStudentsListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/students")({
  head: () => ({
    meta: [
      { title: "Hostel Students — InSuite" },
      { name: "description", content: "Boarding students directory and room allocations." },
    ],
  }),
  component: HostelStudentsPage,
});

function HostelStudentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelStudentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
