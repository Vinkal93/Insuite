import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { BookDetailView } from "@/features/library";

export const Route = createFileRoute("/library/books/$bookId/")({
  head: () => ({
    meta: [
      { title: "Book Details — InSuite" },
      { name: "description", content: "View book inventory, copies, and loan history." },
    ],
  }),
  component: BookDetailPage,
});

function BookDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <BookDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
