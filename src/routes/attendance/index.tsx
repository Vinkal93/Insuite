import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AttendanceDashboardView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/")({
  head: () => ({
    meta: [
      { title: "Attendance Dashboard — InSuite" },
      { name: "description", content: "School student and staff attendance monitoring dashboard." },
    ],
  }),
  component: AttendanceDashboardPage,
});

function AttendanceDashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Attendance">
        <AttendanceDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
