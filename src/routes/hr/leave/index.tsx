import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LeaveManagementView } from "@/features/hr";

export const Route = createFileRoute("/hr/leave/")({
  head: () => ({
    meta: [
      { title: "Staff Leave Management — InSuite" },
      { name: "description", content: "Review and approve employee time-off." },
    ],
  }),
  component: LeaveManagementPage,
});

function LeaveManagementPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <LeaveManagementView />
      </AppLayout>
    </ProtectedRoute>
  );
}
