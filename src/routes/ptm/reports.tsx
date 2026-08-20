import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmReportsView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/reports")({
  head: () => ({
    meta: [
      { title: "PTM Reports & Analytics — InSuite" },
      { name: "description", content: "Conference attendance analytics and exports." },
    ],
  }),
  component: PtmReportsPage,
});

function PtmReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
