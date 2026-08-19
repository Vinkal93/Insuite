import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ReceiptsListView } from "@/features/fees";

export const Route = createFileRoute("/fees/receipts")({
  head: () => ({
    meta: [
      { title: "Fee Receipts — InSuite" },
      { name: "description", content: "Print and verify student fee payment receipts." },
    ],
  }),
  component: ReceiptsListPage,
});

function ReceiptsListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Receipts">
        <ReceiptsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
