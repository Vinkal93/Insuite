import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HrDashboardView } from "@/features/hr";

export const Route = createFileRoute("/hr/")({
  head: () => ({
    meta: [
      { title: "Staff & HR Dashboard — InSuite" },
      { name: "description", content: "Workforce directory, attendance roll-calls, and HR analytics." },
    ],
  }),
  component: HrDashboardPage,
});

function HrDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HrDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
