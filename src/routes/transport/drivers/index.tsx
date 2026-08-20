import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DriversListView } from "@/features/transport";

export const Route = createFileRoute("/transport/drivers/")({
  head: () => ({
    meta: [
      { title: "Transport Drivers — InSuite" },
      { name: "description", content: "Faculty drivers, commercial licenses, and vehicle assignments." },
    ],
  }),
  component: DriversListPage,
});

function DriversListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DriversListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
