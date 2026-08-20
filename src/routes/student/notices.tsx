import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentNoticesView } from "@/features/student";

export const Route = createFileRoute("/student/notices")({
  head: () => ({
    meta: [
      { title: "Circulars & Notices — Student Portal" },
      { name: "description", content: "Official student announcements and bulletins." },
    ],
  }),
  component: StudentNoticesPage,
});

function StudentNoticesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentNoticesView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
