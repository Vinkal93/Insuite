import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherAssignmentsListView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/assignments/")({
  head: () => ({
    meta: [
      { title: "Assignments — Teacher Portal" },
      { name: "description", content: "Coursework, homework, and deadlines." },
    ],
  }),
  component: TeacherAssignmentsPage,
});

function TeacherAssignmentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherAssignmentsListView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
