import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PaymentsListView } from "@/features/fees";

export const Route = createFileRoute("/fees/payments")({
  head: () => ({
    meta: [
      { title: "Fee Payments — InSuite" },
      { name: "description", content: "Payment transaction logs and issued receipts." },
    ],
  }),
  component: PaymentsListPage,
});

function PaymentsListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Payments">
        <PaymentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
