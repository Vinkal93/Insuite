import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewClassView } from "@/features/academics";

export const Route = createFileRoute("/academics/classes/new")({
  head: () => ({
    meta: [
      { title: "Add New Class — InSuite" },
      { name: "description", content: "Create a new grade level and class structure." },
    ],
  }),
  component: NewClassPage,
});

function NewClassPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="New Class">
        <NewClassView />
      </AppLayout>
    </ProtectedRoute>
  );
}
