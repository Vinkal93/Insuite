import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateRouteView } from "@/features/transport";

export const Route = createFileRoute("/transport/routes/new")({
  head: () => ({
    meta: [
      { title: "Create Transit Route — InSuite" },
      { name: "description", content: "Define route path, sequence stops, and assign fleet vehicles." },
    ],
  }),
  component: CreateRoutePage,
});

function CreateRoutePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateRouteView />
      </AppLayout>
    </ProtectedRoute>
  );
}
