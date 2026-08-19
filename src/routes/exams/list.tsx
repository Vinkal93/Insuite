import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ExamListView } from "@/features/exams";

export const Route = createFileRoute("/exams/list")({
  head: () => ({
    meta: [
      { title: "Examinations Directory — InSuite" },
      { name: "description", content: "View all academic examinations." },
    ],
  }),
  component: ExamListPage,
});

function ExamListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ExamListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
