import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { InventoryItemsListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/items/")({
  head: () => ({
    meta: [
      { title: "Inventory Items Catalog — InSuite" },
      { name: "description", content: "Consumable stock items and supplies directory." },
    ],
  }),
  component: InventoryItemsPage,
});

function InventoryItemsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <InventoryItemsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
