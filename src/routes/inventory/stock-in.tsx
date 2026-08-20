import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StockInView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/stock-in")({
  head: () => ({
    meta: [
      { title: "Stock Inward (Stock In) — InSuite" },
      { name: "description", content: "Receive and record new stock inventory." },
    ],
  }),
  component: StockInPage,
});

function StockInPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StockInView />
      </AppLayout>
    </ProtectedRoute>
  );
}
