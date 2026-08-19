import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TakeStaffAttendanceView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/staff/take")({
  head: () => ({
    meta: [
      { title: "Take Staff Attendance — InSuite" },
      { name: "description", content: "Mark faculty and staff presence." },
    ],
  }),
  component: TakeStaffAttendancePage,
});

function TakeStaffAttendancePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Mark Faculty">
        <TakeStaffAttendanceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
