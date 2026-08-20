import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherExamsListView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/exams/")({
  head: () => ({
    meta: [
      { title: "Exams & Marks Entry — Teacher Portal" },
      { name: "description", content: "Assigned class exams and marks entry." },
    ],
  }),
  component: TeacherExamsPage,
});

function TeacherExamsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherExamsListView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
