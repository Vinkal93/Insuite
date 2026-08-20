import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { RouteDetailView } from "@/features/transport";

export const Route = createFileRoute("/transport/routes/$routeId/")({
  head: () => ({
    meta: [
      { title: "Route Dossier — InSuite" },
      { name: "description", content: "Route map stops, vehicle allocation, and student passenger rolls." },
    ],
  }),
  component: RouteDetailPage,
});

function RouteDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <RouteDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
