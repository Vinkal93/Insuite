import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TimetableSettingsView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/settings")({
  head: () => ({
    meta: [
      { title: "Timetable Settings — InSuite" },
      { name: "description", content: "Working days, conflict validation, and schedule preferences." },
    ],
  }),
  component: TimetableSettingsPage,
});

function TimetableSettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Timetable Settings">
        <TimetableSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
