import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StaffAttendanceListView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/staff/")({
  head: () => ({
    meta: [
      { title: "Staff Attendance — InSuite" },
      { name: "description", content: "Faculty and staff daily attendance logs." },
    ],
  }),
  component: StaffAttendancePage,
});

function StaffAttendancePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Staff Attendance">
        <StaffAttendanceListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
