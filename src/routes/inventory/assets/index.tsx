import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssetsListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/assets/")({
  head: () => ({
    meta: [
      { title: "Fixed Asset Register — InSuite" },
      { name: "description", content: "Campus equipment, computers, lab gear, and furniture directory." },
    ],
  }),
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AssetsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
