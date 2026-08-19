import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateAssignmentView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/assignments/$assignmentId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Assignment — InSuite" },
      { name: "description", content: "Modify existing assignment details and deadlines." },
    ],
  }),
  component: EditAssignmentPage,
});

function EditAssignmentPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Edit Assignment">
        <CreateAssignmentView isEditMode={true} />
      </AppLayout>
    </ProtectedRoute>
  );
}
