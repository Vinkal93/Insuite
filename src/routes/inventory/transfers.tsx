import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TransfersListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/transfers")({
  head: () => ({
    meta: [
      { title: "Asset Transfers Ledger — InSuite" },
      { name: "description", content: "Campus equipment handover and relocation audit trail." },
    ],
  }),
  component: TransfersPage,
});

function TransfersPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TransfersListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
