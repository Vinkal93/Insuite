import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CollectFeesView } from "@/features/fees";

export const Route = createFileRoute("/fees/collect")({
  validateSearch: (search: Record<string, unknown>): { studentId?: string; invoiceId?: string } => {
    return {
      studentId: (search.studentId as string) || undefined,
      invoiceId: (search.invoiceId as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Collect Fees — InSuite" },
      { name: "description", content: "Collect fee payments and issue receipts." },
    ],
  }),
  component: CollectFeesPage,
});

function CollectFeesPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Collect Fees">
        <CollectFeesView />
      </AppLayout>
    </ProtectedRoute>
  );
}
