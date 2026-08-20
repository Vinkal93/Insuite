import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AuthorsListView } from "@/features/library";

export const Route = createFileRoute("/library/authors")({
  head: () => ({
    meta: [
      { title: "Book Authors — InSuite" },
      { name: "description", content: "Author and contributor profiles." },
    ],
  }),
  component: AuthorsPage,
});

function AuthorsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AuthorsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
