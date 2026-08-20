import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherNotificationsView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/notifications")({
  head: () => ({
    meta: [
      { title: "Teacher Notifications — InSuite" },
      { name: "description", content: "Assignment submissions, exam notices, and reminders." },
    ],
  }),
  component: TeacherNotificationsPage,
});

function TeacherNotificationsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherNotificationsView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
