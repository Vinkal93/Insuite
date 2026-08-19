import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewAcademicSessionView } from "@/features/academics";

export const Route = createFileRoute("/academics/sessions/new")({
  head: () => ({
    meta: [
      { title: "New Academic Session — InSuite" },
      { name: "description", content: "Create a new institutional academic year session." },
    ],
  }),
  component: NewAcademicSessionPage,
});

function NewAcademicSessionPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="New Session">
        <NewAcademicSessionView />
      </AppLayout>
    </ProtectedRoute>
  );
}
