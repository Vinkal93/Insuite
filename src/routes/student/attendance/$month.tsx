import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentAttendanceView } from "@/features/student";

export const Route = createFileRoute("/student/attendance/$month")({
  head: () => ({
    meta: [
      { title: "Monthly Attendance — Student Portal" },
      { name: "description", content: "Monthly attendance history and day-by-day logs." },
    ],
  }),
  component: MonthlyAttendancePage,
});

function MonthlyAttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentAttendanceView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
