import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherClassesListView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/students/")({
  head: () => ({
    meta: [
      { title: "Student Roster — Teacher Portal" },
      { name: "description", content: "Students in your assigned classes." },
    ],
  }),
  component: TeacherStudentsPage,
});

function TeacherStudentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherClassesListView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
