import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentProfileView } from "@/features/student";

export const Route = createFileRoute("/student/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — Student Portal" },
      { name: "description", content: "Student admission profile and personal information." },
    ],
  }),
  component: StudentProfilePage,
});

function StudentProfilePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentProfileView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
