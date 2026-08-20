import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { InventoryItemDetailView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/items/$itemId")({
  head: () => ({
    meta: [
      { title: "Inventory Item Ledger — InSuite" },
      { name: "description", content: "Item stock ledger, history, and physical count adjustments." },
    ],
  }),
  component: InventoryItemDetailPage,
});

function InventoryItemDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <InventoryItemDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
