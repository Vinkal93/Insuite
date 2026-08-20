import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherProfileView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/profile")({
  head: () => ({
    meta: [
      { title: "Faculty Profile — Teacher Portal" },
      { name: "description", content: "Staff credentials and teaching responsibilities." },
    ],
  }),
  component: TeacherProfilePage,
});

function TeacherProfilePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherProfileView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
