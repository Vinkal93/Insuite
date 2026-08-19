import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LeaveManagementView } from "@/features/attendance";

export const Route = createFileRoute("/attendance/leave")({
  head: () => ({
    meta: [
      { title: "Leave Management — InSuite" },
      { name: "description", content: "Staff leave requests, approvals, and tracking." },
    ],
  }),
  component: LeaveManagementPage,
});

function LeaveManagementPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Leave Management">
        <LeaveManagementView />
      </AppLayout>
    </ProtectedRoute>
  );
}
