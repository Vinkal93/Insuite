import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DiscountsListView } from "@/features/fees";

export const Route = createFileRoute("/fees/discounts")({
  head: () => ({
    meta: [
      { title: "Fee Discounts — InSuite" },
      { name: "description", content: "Scholarships and concessions management." },
    ],
  }),
  component: DiscountsListPage,
});

function DiscountsListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Discounts">
        <DiscountsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
