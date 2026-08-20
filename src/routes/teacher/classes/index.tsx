import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherClassesListView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/classes/")({
  head: () => ({
    meta: [
      { title: "My Classes — Faculty Workspace" },
      { name: "description", content: "Assigned classes, sections, and subjects." },
    ],
  }),
  component: TeacherClassesPage,
});

function TeacherClassesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherClassesListView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
