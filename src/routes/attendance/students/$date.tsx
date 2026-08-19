import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentAttendanceListView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/students/$date")({
  head: () => ({
    meta: [
      { title: "Student Attendance Log — InSuite" },
      { name: "description", content: "Review student attendance records for a specific date." },
    ],
  }),
  component: StudentAttendanceDatePage,
});

function StudentAttendanceDatePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Student Attendance">
        <StudentAttendanceListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
