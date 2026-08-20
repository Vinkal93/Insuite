import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ApplyLeaveView } from "@/features/hr";

export const Route = createFileRoute("/hr/leave/new")({
  head: () => ({
    meta: [
      { title: "Apply Staff Leave — InSuite" },
      { name: "description", content: "Submit employee leave request." },
    ],
  }),
  component: ApplyLeavePage,
});

function ApplyLeavePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ApplyLeaveView />
      </AppLayout>
    </ProtectedRoute>
  );
}
