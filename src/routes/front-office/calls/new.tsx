import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LogCallView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/calls/new")({
  head: () => ({
    meta: [
      { title: "Log Phone Call — InSuite" },
      { name: "description", content: "Record front desk call details." },
    ],
  }),
  component: LogCallPage,
});

function LogCallPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <LogCallView />
      </AppLayout>
    </ProtectedRoute>
  );
}
