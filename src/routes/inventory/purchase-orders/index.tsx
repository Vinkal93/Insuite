import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PurchaseOrdersListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/purchase-orders/")({
  head: () => ({
    meta: [
      { title: "Purchase Orders Directory — InSuite" },
      { name: "description", content: "Procurement orders, approval workflows, and receiving status." },
    ],
  }),
  component: PurchaseOrdersPage,
});

function PurchaseOrdersPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PurchaseOrdersListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
