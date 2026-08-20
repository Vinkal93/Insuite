import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentDashboardView } from "@/features/student";

export const Route = createFileRoute("/student/")({
  head: () => ({
    meta: [
      { title: "Student Dashboard — InSuite" },
      { name: "description", content: "Academic summaries, homework, exams, and attendance." },
    ],
  }),
  component: StudentDashboardPage,
});

function StudentDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentDashboardView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
