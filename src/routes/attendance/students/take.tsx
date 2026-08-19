import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TakeStudentAttendanceView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/students/take")({
  head: () => ({
    meta: [
      { title: "Take Student Attendance — InSuite" },
      { name: "description", content: "Mark daily student presence and roll call by classroom." },
    ],
  }),
  component: TakeStudentAttendancePage,
});

function TakeStudentAttendancePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Take Attendance">
        <TakeStudentAttendanceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
