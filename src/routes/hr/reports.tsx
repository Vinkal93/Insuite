import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HrReportsView } from "@/features/hr";

export const Route = createFileRoute("/hr/reports")({
  head: () => ({
    meta: [
      { title: "Staff & HR Reports — InSuite" },
      { name: "description", content: "Workforce directory, attendance, leaves, and payroll export." },
    ],
  }),
  component: HrReportsPage,
});

function HrReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HrReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
