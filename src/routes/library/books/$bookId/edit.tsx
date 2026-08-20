import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { EditBookView } from "@/features/library";

export const Route = createFileRoute("/library/books/$bookId/edit")({
  head: () => ({
    meta: [
      { title: "Edit Book — InSuite" },
      { name: "description", content: "Update book metadata and circulation parameters." },
    ],
  }),
  component: EditBookPage,
});

function EditBookPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <EditBookView />
      </AppLayout>
    </ProtectedRoute>
  );
}
