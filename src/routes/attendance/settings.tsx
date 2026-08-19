import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AttendanceSettingsView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/settings")({
  head: () => ({
    meta: [
      { title: "Attendance Settings — InSuite" },
      { name: "description", content: "Configure attendance grace times, half-day thresholds, and working days." },
    ],
  }),
  component: AttendanceSettingsPage,
});

function AttendanceSettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Attendance Settings">
        <AttendanceSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
