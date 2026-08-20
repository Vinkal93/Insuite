import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { InventorySettingsView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/settings")({
  head: () => ({
    meta: [
      { title: "Inventory Settings — InSuite" },
      { name: "description", content: "Configurable prefixes, storage locations, units, and depreciation rules." },
    ],
  }),
  component: InventorySettingsPage,
});

function InventorySettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <InventorySettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
