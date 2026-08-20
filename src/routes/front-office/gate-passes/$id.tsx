import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { GatePassDetailView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/gate-passes/$id")({
  head: () => ({
    meta: [
      { title: "Gate Pass View & Print — InSuite" },
      { name: "description", content: "Official security gate pass slip." },
    ],
  }),
  component: GatePassDetailPage,
});

function GatePassDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <GatePassDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
