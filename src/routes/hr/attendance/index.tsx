import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StaffAttendanceView } from "@/features/hr";

export const Route = createFileRoute("/hr/attendance/")({
  head: () => ({
    meta: [
      { title: "Staff Attendance — InSuite" },
      { name: "description", content: "Faculty and employee attendance tracking." },
    ],
  }),
  component: StaffAttendancePage,
});

function StaffAttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StaffAttendanceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
