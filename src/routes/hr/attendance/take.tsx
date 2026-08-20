import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TakeStaffAttendanceView } from "@/features/hr";

export const Route = createFileRoute("/hr/attendance/take")({
  head: () => ({
    meta: [
      { title: "Take Staff Attendance — InSuite" },
      { name: "description", content: "Record daily staff attendance roll-call." },
    ],
  }),
  component: TakeStaffAttendancePage,
});

function TakeStaffAttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TakeStaffAttendanceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
