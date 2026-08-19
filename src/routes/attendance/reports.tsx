import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AttendanceReportsView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/reports")({
  head: () => ({
    meta: [
      { title: "Attendance Reports — InSuite" },
      { name: "description", content: "School attendance analysis, summaries, and exports." },
    ],
  }),
  component: AttendanceReportsPage,
});

function AttendanceReportsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Attendance Reports">
        <AttendanceReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
