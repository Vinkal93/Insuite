import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { EditStaffView } from "@/features/hr";

export const Route = createFileRoute("/hr/staff/$staffId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Staff Profile — InSuite" },
      { name: "description", content: "Update employee information." },
    ],
  }),
  component: EditStaffPage,
});

function EditStaffPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <EditStaffView />
      </AppLayout>
    </ProtectedRoute>
  );
}
