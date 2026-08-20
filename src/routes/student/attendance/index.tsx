import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentAttendanceView } from "@/features/student";

export const Route = createFileRoute("/student/attendance/")({
  head: () => ({
    meta: [
      { title: "My Attendance — Student Portal" },
      { name: "description", content: "Monthly roll call logs and attendance rate." },
    ],
  }),
  component: StudentAttendancePage,
});

function StudentAttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentAttendanceView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
