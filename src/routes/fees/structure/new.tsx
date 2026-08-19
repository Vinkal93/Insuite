import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateFeeStructureView } from "@/features/fees";

export const Route = createFileRoute("/fees/structure/new")({
  head: () => ({
    meta: [
      { title: "Create Fee Structure — InSuite" },
      { name: "description", content: "Configure tuition components and fees." },
    ],
  }),
  component: CreateFeeStructurePage,
});

function CreateFeeStructurePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Create Fee Structure">
        <CreateFeeStructureView />
      </AppLayout>
    </ProtectedRoute>
  );
}
