import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PayrollListView } from "@/features/hr";

export const Route = createFileRoute("/hr/payroll/")({
  head: () => ({
    meta: [
      { title: "Staff Payroll & Compensation — InSuite" },
      { name: "description", content: "Monthly salary calculation, allowances, and payouts." },
    ],
  }),
  component: PayrollListPage,
});

function PayrollListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PayrollListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
