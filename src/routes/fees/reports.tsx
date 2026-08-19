import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FinancialReportsView } from "@/features/fees";

export const Route = createFileRoute("/fees/reports")({
  head: () => ({
    meta: [
      { title: "Financial Reports — InSuite" },
      { name: "description", content: "Collection, realization, and revenue ledger analytics." },
    ],
  }),
  component: FinancialReportsPage,
});

function FinancialReportsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Financial Reports">
        <FinancialReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
