import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicAssignmentsView } from "@/features/academics";

export const Route = createFileRoute("/academics/assignments")({
  head: () => ({
    meta: [
      { title: "Academic Assignments — InSuite" },
      { name: "description", content: "Assign class teachers and subject educators across classes." },
    ],
  }),
  component: AcademicAssignmentsPage,
});

function AcademicAssignmentsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Teacher Assignments">
        <AcademicAssignmentsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
