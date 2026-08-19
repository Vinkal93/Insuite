import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ExamsDashboardView } from "@/features/exams";

export const Route = createFileRoute("/exams/")({
  head: () => ({
    meta: [
      { title: "Examinations & Results Dashboard — InSuite" },
      { name: "description", content: "School examination, schedule, and grade command center." },
    ],
  }),
  component: ExamsDashboardPage,
});

function ExamsDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ExamsDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
