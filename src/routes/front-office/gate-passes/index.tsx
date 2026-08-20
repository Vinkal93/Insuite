import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { GatePassesListView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/gate-passes/")({
  head: () => ({
    meta: [
      { title: "Gate Passes — InSuite" },
      { name: "description", content: "Campus security passes and access authorization." },
    ],
  }),
  component: GatePassesPage,
});

function GatePassesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <GatePassesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
