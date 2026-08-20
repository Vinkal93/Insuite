import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StaffSalaryDetailView } from "@/features/hr";

export const Route = createFileRoute("/hr/payroll/$staffId")({
  head: () => ({
    meta: [
      { title: "Staff Salary Profile — InSuite" },
      { name: "description", content: "Configure basic pay, allowances, and deductions." },
    ],
  }),
  component: StaffSalaryDetailPage,
});

function StaffSalaryDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StaffSalaryDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
