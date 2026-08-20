import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { InventoryDashboardView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/")({
  head: () => ({
    meta: [
      { title: "Inventory & Assets Dashboard — InSuite" },
      { name: "description", content: "Consumable stock, fixed asset register, and procurement workflows." },
    ],
  }),
  component: InventoryDashboardPage,
});

function InventoryDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <InventoryDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
