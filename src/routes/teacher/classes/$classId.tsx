import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherClassDetailView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class Students Roster — Teacher Portal" },
      { name: "description", content: "Enrolled students list and profiles." },
    ],
  }),
  component: ClassDetailPage,
});

function ClassDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherClassDetailView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
