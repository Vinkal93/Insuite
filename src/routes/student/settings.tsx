import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentSettingsView } from "@/features/student";

export const Route = createFileRoute("/student/settings")({
  head: () => ({
    meta: [
      { title: "Student Settings — InSuite" },
      { name: "description", content: "Portal credentials and account security." },
    ],
  }),
  component: StudentSettingsPage,
});

function StudentSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentSettingsView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
