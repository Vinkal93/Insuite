import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssetAssignmentsListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/assignments")({
  head: () => ({
    meta: [
      { title: "Asset Custodian Assignments — InSuite" },
      { name: "description", content: "Faculty and departmental fixed asset custody tracking." },
    ],
  }),
  component: AssignmentsPage,
});

function AssignmentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AssetAssignmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
