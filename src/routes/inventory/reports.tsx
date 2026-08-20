import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { InventoryReportsView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/reports")({
  head: () => ({
    meta: [
      { title: "Inventory & Asset Reports — InSuite" },
      { name: "description", content: "Valuation, movements, low stock, and fixed asset register CSV exports." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <InventoryReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
