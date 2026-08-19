import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssignmentsListView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/assignments/")({
  head: () => ({
    meta: [
      { title: "Assignments — InSuite" },
      { name: "description", content: "Academic assignments, worksheets, and projects directory." },
    ],
  }),
  component: AssignmentsListPage,
});

function AssignmentsListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Assignments">
        <AssignmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
