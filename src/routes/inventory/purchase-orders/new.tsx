import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreatePurchaseOrderView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/purchase-orders/new")({
  head: () => ({
    meta: [
      { title: "New Purchase Order — InSuite" },
      { name: "description", content: "Generate a multi-item purchase requisition order." },
    ],
  }),
  component: CreatePurchaseOrderPage,
});

function CreatePurchaseOrderPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreatePurchaseOrderView />
      </AppLayout>
    </ProtectedRoute>
  );
}
