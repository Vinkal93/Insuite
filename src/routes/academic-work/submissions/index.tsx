import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SubmissionsListView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/submissions/")({
  head: () => ({
    meta: [
      { title: "Submissions — InSuite" },
      { name: "description", content: "Student assignment and homework submissions." },
    ],
  }),
  component: SubmissionsListPage,
});

function SubmissionsListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Submissions">
        <SubmissionsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
