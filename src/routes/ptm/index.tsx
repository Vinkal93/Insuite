import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmDashboardView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/")({
  head: () => ({
    meta: [
      { title: "PTM Dashboard — InSuite" },
      { name: "description", content: "Parent-Teacher meeting scheduling and appointment management." },
    ],
  }),
  component: PtmDashboardPage,
});

function PtmDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
