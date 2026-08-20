import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DesignationsListView } from "@/features/hr";

export const Route = createFileRoute("/hr/designations")({
  head: () => ({
    meta: [
      { title: "Designations — InSuite" },
      { name: "description", content: "Organizational roles and designations." },
    ],
  }),
  component: DesignationsPage,
});

function DesignationsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DesignationsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
