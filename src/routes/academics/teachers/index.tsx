import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TeachersListView } from "@/features/academics";

export const Route = createFileRoute("/academics/teachers/")({
  head: () => ({
    meta: [
      { title: "Faculty & Teachers — InSuite" },
      { name: "description", content: "Manage school teachers, employment records, and assignments." },
    ],
  }),
  component: TeachersPage,
});

function TeachersPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Teachers">
        <TeachersListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
