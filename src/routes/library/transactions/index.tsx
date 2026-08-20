import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TransactionsListView } from "@/features/library";

export const Route = createFileRoute("/library/transactions/")({
  head: () => ({
    meta: [
      { title: "Circulation & Transactions — InSuite" },
      { name: "description", content: "Issue, renew, and return book loans." },
    ],
  }),
  component: TransactionsListPage,
});

function TransactionsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TransactionsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
