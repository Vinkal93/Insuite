import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentTransportView } from "@/features/student";

export const Route = createFileRoute("/student/transport")({
  head: () => ({
    meta: [
      { title: "My Transport — Student Portal" },
      { name: "description", content: "School bus route, vehicle number, and stop." },
    ],
  }),
  component: StudentTransportPage,
});

function StudentTransportPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentTransportView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
