import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherSubmissionsListView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/submissions/")({
  head: () => ({
    meta: [
      { title: "Student Submissions — Teacher Portal" },
      { name: "description", content: "Review and evaluate uploaded student assignments." },
    ],
  }),
  component: TeacherSubmissionsPage,
});

function TeacherSubmissionsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherSubmissionsListView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
