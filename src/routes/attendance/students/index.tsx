import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentAttendanceListView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/students/")({
  head: () => ({
    meta: [
      { title: "Student Attendance — InSuite" },
      { name: "description", content: "Daily student roll call records and logs." },
    ],
  }),
  component: StudentAttendancePage,
});

function StudentAttendancePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Student Attendance">
        <StudentAttendanceListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
