import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DefaultersListView } from "@/features/fees";

export const Route = createFileRoute("/fees/defaulters")({
  head: () => ({
    meta: [
      { title: "Fee Defaulters — InSuite" },
      { name: "description", content: "Overdue fee invoices and student follow-up." },
    ],
  }),
  component: DefaultersListPage,
});

function DefaultersListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Defaulters">
        <DefaultersListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
