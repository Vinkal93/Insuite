import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewSubjectView } from "@/features/academics";

export const Route = createFileRoute("/academics/subjects/new")({
  head: () => ({
    meta: [
      { title: "Add New Subject — InSuite" },
      { name: "description", content: "Create a new subject with theory and practical evaluation rules." },
    ],
  }),
  component: NewSubjectPage,
});

function NewSubjectPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="New Subject">
        <NewSubjectView />
      </AppLayout>
    </ProtectedRoute>
  );
}
