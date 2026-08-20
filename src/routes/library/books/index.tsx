import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { BooksListView } from "@/features/library";

export const Route = createFileRoute("/library/books/")({
  head: () => ({
    meta: [
      { title: "Library Books Catalog — InSuite" },
      { name: "description", content: "Catalog titles, physical copies, and shelf locations." },
    ],
  }),
  component: BooksListPage,
});

function BooksListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <BooksListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
