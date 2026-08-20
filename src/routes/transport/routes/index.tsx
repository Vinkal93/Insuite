import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { RoutesListView } from "@/features/transport";

export const Route = createFileRoute("/transport/routes/")({
  head: () => ({
    meta: [
      { title: "Transport Routes — InSuite" },
      { name: "description", content: "School transit routes, stops, and schedules." },
    ],
  }),
  component: RoutesListPage,
});

function RoutesListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <RoutesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
