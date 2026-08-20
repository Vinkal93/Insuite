import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentTransportListView } from "@/features/transport";

export const Route = createFileRoute("/transport/students")({
  head: () => ({
    meta: [
      { title: "Student Commuters — InSuite" },
      { name: "description", content: "Student passengers manifest by class and route." },
    ],
  }),
  component: StudentTransportListPage,
});

function StudentTransportListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StudentTransportListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
