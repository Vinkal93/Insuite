import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherCreateAssignmentView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/assignments/new")({
  head: () => ({
    meta: [
      { title: "Create Assignment — Teacher Portal" },
      { name: "description", content: "Create and publish new student coursework." },
    ],
  }),
  component: CreateAssignmentPage,
});

function CreateAssignmentPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherCreateAssignmentView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
