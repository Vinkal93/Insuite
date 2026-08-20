import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentAttendanceView } from "@/features/parent";

export const Route = createFileRoute("/parent/attendance")({
  head: () => ({
    meta: [
      { title: "Student Attendance — InSuite Parent Portal" },
      { name: "description", content: "Monthly attendance percentages, present days, and leave history." },
    ],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentAttendanceView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
