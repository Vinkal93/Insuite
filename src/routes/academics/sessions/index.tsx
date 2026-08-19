import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicSessionsListView } from "@/features/academics";

export const Route = createFileRoute("/academics/sessions/")({
  head: () => ({
    meta: [
      { title: "Academic Sessions — InSuite" },
      { name: "description", content: "Manage institutional school year academic sessions." },
    ],
  }),
  component: AcademicSessionsPage,
});

function AcademicSessionsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Academic Sessions">
        <AcademicSessionsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
