import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ResultDetailView } from "@/features/exams";

export const Route = createFileRoute("/exams/results/$resultId")({
  head: () => ({
    meta: [
      { title: "Student Scorecard & Result Details — InSuite" },
      { name: "description", content: "View detailed student examination scorecard." },
    ],
  }),
  component: ResultDetailPage,
});

function ResultDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ResultDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
