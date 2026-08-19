import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewSectionView } from "@/features/academics";

export const Route = createFileRoute("/academics/sections/new")({
  head: () => ({
    meta: [
      { title: "Add New Section — InSuite" },
      { name: "description", content: "Create a new section batch for a grade level." },
    ],
  }),
  component: NewSectionPage,
});

function NewSectionPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="New Section">
        <NewSectionView />
      </AppLayout>
    </ProtectedRoute>
  );
}
