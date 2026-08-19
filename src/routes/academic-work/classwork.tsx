import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssignmentsListView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/classwork")({
  head: () => ({
    meta: [
      { title: "Classwork Management — InSuite" },
      { name: "description", content: "In-class tasks, exercises, and lab sessions." },
    ],
  }),
  component: ClassworkPage,
});

function ClassworkPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Classwork">
        <AssignmentsListView
          fixedType="Classwork"
          titleOverride="Classwork & Exercises"
          subtitleOverride="In-class work, problem sets, and practical assignments."
        />
      </AppLayout>
    </ProtectedRoute>
  );
}
