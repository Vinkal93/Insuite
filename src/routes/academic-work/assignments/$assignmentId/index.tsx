import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssignmentDetailView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/assignments/$assignmentId/")({
  head: () => ({
    meta: [
      { title: "Assignment Details — InSuite" },
      { name: "description", content: "Assignment instructions, submission summary, and timeline." },
    ],
  }),
  component: AssignmentDetailPage,
});

function AssignmentDetailPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Assignment Details">
        <AssignmentDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
