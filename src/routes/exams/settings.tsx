import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ExamSettingsView } from "@/features/exams";

export const Route = createFileRoute("/exams/settings")({
  head: () => ({
    meta: [
      { title: "Examination & Grading Settings — InSuite" },
      { name: "description", content: "Configure exam types, passing rules, and grading scale." },
    ],
  }),
  component: ExamSettingsPage,
});

function ExamSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ExamSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
