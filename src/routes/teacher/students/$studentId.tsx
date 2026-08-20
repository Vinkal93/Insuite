import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherStudentDetailView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Record — Teacher Portal" },
      { name: "description", content: "Academic performance and attendance tracking." },
    ],
  }),
  component: StudentDetailPage,
});

function StudentDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherStudentDetailView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
