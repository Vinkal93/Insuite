import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherSettingsView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/settings")({
  head: () => ({
    meta: [
      { title: "Teacher Settings — InSuite" },
      { name: "description", content: "Faculty credentials and account security." },
    ],
  }),
  component: TeacherSettingsPage,
});

function TeacherSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherSettingsView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
