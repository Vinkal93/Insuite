import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateInventoryItemView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/items/new")({
  head: () => ({
    meta: [
      { title: "Add Inventory Item — InSuite" },
      { name: "description", content: "Create a new consumable or laboratory inventory item." },
    ],
  }),
  component: CreateInventoryItemPage,
});

function CreateInventoryItemPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateInventoryItemView />
      </AppLayout>
    </ProtectedRoute>
  );
}
