import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherNoticesView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/notices")({
  head: () => ({
    meta: [
      { title: "Staff Circulars — Teacher Portal" },
      { name: "description", content: "Faculty broadcasts and official staff circulars." },
    ],
  }),
  component: TeacherNoticesPage,
});

function TeacherNoticesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherNoticesView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
