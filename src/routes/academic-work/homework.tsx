import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssignmentsListView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/homework")({
  head: () => ({
    meta: [
      { title: "Homework Management — InSuite" },
      { name: "description", content: "Daily subject homework and tasks directory." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Homework">
        <AssignmentsListView
          fixedType="Homework"
          titleOverride="Homework Management"
          subtitleOverride="Review, assign and monitor daily homework across sections."
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
