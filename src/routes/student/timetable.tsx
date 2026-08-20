import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentTimetableView } from "@/features/student";

export const Route = createFileRoute("/student/timetable")({
  head: () => ({
    meta: [
      { title: "Class Timetable — Student Portal" },
      { name: "description", content: "Weekly class schedule and period allocations." },
    ],
  }),
  component: StudentTimetablePage,
});

function StudentTimetablePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentTimetableView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
