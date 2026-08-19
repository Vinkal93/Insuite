import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ResultsProcessingView } from "@/features/exams";

export const Route = createFileRoute("/exams/results/")({
  head: () => ({
    meta: [
      { title: "Result Processing — InSuite" },
      { name: "description", content: "Calculate and publish examination results." },
    ],
  }),
  component: ResultsProcessingPage,
});

function ResultsProcessingPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ResultsProcessingView />
      </AppLayout>
    </ProtectedRoute>
  );
}
