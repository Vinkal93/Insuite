import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ExamScheduleView } from "@/features/exams";

export const Route = createFileRoute("/exams/schedule")({
  head: () => ({
    meta: [
      { title: "Examination Schedule — InSuite" },
      { name: "description", content: "View and manage exam date slots and rooms." },
    ],
  }),
  component: ExamSchedulePage,
});

function ExamSchedulePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ExamScheduleView />
      </AppLayout>
    </ProtectedRoute>
  );
}
