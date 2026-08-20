import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CategoriesListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/categories")({
  head: () => ({
    meta: [
      { title: "Inventory & Asset Categories — InSuite" },
      { name: "description", content: "Manage categories for consumables and capital assets." },
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
