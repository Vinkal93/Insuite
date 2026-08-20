import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentHostelView } from "@/features/student";

export const Route = createFileRoute("/student/hostel")({
  head: () => ({
    meta: [
      { title: "My Hostel — Student Portal — InSuite" },
      { name: "description", content: "Boarding house allotment, room and bed info, and out-pass requests." },
    ],
  }),
  component: StudentHostelPage,
});

function StudentHostelPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentHostelView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
