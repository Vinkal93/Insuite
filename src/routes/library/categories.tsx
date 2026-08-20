import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CategoriesListView } from "@/features/library";

export const Route = createFileRoute("/library/categories")({
  head: () => ({
    meta: [
      { title: "Book Categories — InSuite" },
      { name: "description", content: "Academic genres and book classifications." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CategoriesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
