import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StockOutView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/stock-out")({
  head: () => ({
    meta: [
      { title: "Issue Stock (Stock Out) — InSuite" },
      { name: "description", content: "Dispense consumable inventory supplies to faculty and departments." },
    ],
  }),
  component: StockOutPage,
});

function StockOutPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StockOutView />
      </AppLayout>
    </ProtectedRoute>
  );
}
