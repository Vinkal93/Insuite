import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PublishersListView } from "@/features/library";

export const Route = createFileRoute("/library/publishers")({
  head: () => ({
    meta: [
      { title: "Book Publishers — InSuite" },
      { name: "description", content: "Academic publication houses and contacts." },
    ],
  }),
  component: PublishersPage,
});

function PublishersPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PublishersListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
