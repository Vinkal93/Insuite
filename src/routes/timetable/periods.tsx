import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PeriodsManagementView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/periods")({
  head: () => ({
    meta: [
      { title: "Period Management — InSuite" },
      { name: "description", content: "Configure school periods, durations, and timings." },
    ],
  }),
  component: PeriodsPage,
});

function PeriodsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Periods">
        <PeriodsManagementView />
      </AppLayout>
    </ProtectedRoute>
  );
}
