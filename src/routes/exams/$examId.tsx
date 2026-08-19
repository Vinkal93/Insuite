import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ExamDetailView } from "@/features/exams";

export const Route = createFileRoute("/exams/$examId")({
  head: () => ({
    meta: [
      { title: "Examination Details — InSuite" },
      { name: "description", content: "Overview and subject configurations for exam." },
    ],
  }),
  component: ExamDetailPage,
});

function ExamDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ExamDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
