import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssignmentsListView } from "@/features/transport";

export const Route = createFileRoute("/transport/assignments")({
  head: () => ({
    meta: [
      { title: "Transport Allocations — InSuite" },
      { name: "description", content: "Student route allocations, stops, and seating capacity verification." },
    ],
  }),
  component: AssignmentsListPage,
});

function AssignmentsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AssignmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
