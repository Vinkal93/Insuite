import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TripsListView } from "@/features/transport";

export const Route = createFileRoute("/transport/trips")({
  head: () => ({
    meta: [
      { title: "Transport Trips — InSuite" },
      { name: "description", content: "Daily morning and afternoon transit runs and operational schedules." },
    ],
  }),
  component: TripsListPage,
});

function TripsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TripsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
