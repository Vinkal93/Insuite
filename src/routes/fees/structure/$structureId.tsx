import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FeeStructureDetailView } from "@/features/fees";

export const Route = createFileRoute("/fees/structure/$structureId")({
  head: () => ({
    meta: [
      { title: "Fee Structure Details — InSuite" },
      { name: "description", content: "View fee breakdown and bill class students." },
    ],
  }),
  component: FeeStructureDetailPage,
});

function FeeStructureDetailPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Structure Details">
        <FeeStructureDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
