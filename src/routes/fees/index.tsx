import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FeesDashboardView } from "@/features/fees";

export const Route = createFileRoute("/fees/")({
  head: () => ({
    meta: [
      { title: "Fees & Finance Dashboard — InSuite" },
      { name: "description", content: "School fee collection, invoices, balances, and revenue reporting." },
    ],
  }),
  component: FeesDashboardPage,
});

function FeesDashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fees & Finance">
        <FeesDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
