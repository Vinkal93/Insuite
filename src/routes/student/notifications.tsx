import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentNotificationsView } from "@/features/student";

export const Route = createFileRoute("/student/notifications")({
  head: () => ({
    meta: [
      { title: "Student Notifications — InSuite" },
      { name: "description", content: "Assignment deadlines, circular alerts, and exam notices." },
    ],
  }),
  component: StudentNotificationsPage,
});

function StudentNotificationsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentNotificationsView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
