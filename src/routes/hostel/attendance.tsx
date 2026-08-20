import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelAttendanceView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/attendance")({
  head: () => ({
    meta: [
      { title: "Hostel Attendance — InSuite" },
      { name: "description", content: "Night roll call and curfew attendance tracking." },
    ],
  }),
  component: HostelAttendancePage,
});

function HostelAttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelAttendanceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
