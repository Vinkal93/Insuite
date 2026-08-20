import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { IdCardsListView } from "@/features/documents";

export const Route = createFileRoute("/documents/id-cards/")({
  head: () => ({
    meta: [
      { title: "ID Cards — InSuite" },
      { name: "description", content: "Student and staff identity cards." },
    ],
  }),
  component: IdCardsPage,
});

function IdCardsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <IdCardsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
