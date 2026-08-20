import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PurchaseOrderDetailView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/purchase-orders/$orderId")({
  head: () => ({
    meta: [
      { title: "Purchase Order Details & Receiving — InSuite" },
      { name: "description", content: "View order line items, approvals, and record stock receipts." },
    ],
  }),
  component: PurchaseOrderDetailPage,
});

function PurchaseOrderDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PurchaseOrderDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
