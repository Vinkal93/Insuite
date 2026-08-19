import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TimetableDashboardView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/")({
  head: () => ({
    meta: [
      { title: "Timetable Dashboard — InSuite" },
      { name: "description", content: "Manage school timetables, teacher allocations, periods, and substitutions." },
    ],
  }),
  component: TimetableDashboardPage,
});

function TimetableDashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Timetable">
        <TimetableDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
