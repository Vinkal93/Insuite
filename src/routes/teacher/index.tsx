import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherDashboardView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/")({
  head: () => ({
    meta: [
      { title: "Teacher Workspace — InSuite" },
      { name: "description", content: "Faculty dashboard, class schedules, assignments, and attendance." },
    ],
  }),
  component: TeacherDashboardPage,
});

function TeacherDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherDashboardView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
