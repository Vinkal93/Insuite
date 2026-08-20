import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateBookView } from "@/features/library";

export const Route = createFileRoute("/library/books/new")({
  head: () => ({
    meta: [
      { title: "Add Book Title — InSuite" },
      { name: "description", content: "Catalog new book title and generate copy barcodes." },
    ],
  }),
  component: CreateBookPage,
});

function CreateBookPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateBookView />
      </AppLayout>
    </ProtectedRoute>
  );
}
