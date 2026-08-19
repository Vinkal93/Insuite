import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FeeStructureListView } from "@/features/fees";

export const Route = createFileRoute("/fees/structure/")({
  head: () => ({
    meta: [
      { title: "Fee Structures — InSuite" },
      { name: "description", content: "Class fee breakdown and component schedules." },
    ],
  }),
  component: FeeStructureListPage,
});

function FeeStructureListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Structures">
        <FeeStructureListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
