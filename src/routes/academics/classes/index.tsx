import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ClassesListView } from "@/features/academics";

export const Route = createFileRoute("/academics/classes/")({
  head: () => ({
    meta: [
      { title: "Classes & Grades — InSuite" },
      { name: "description", content: "Manage school grade levels, class codes, and sections." },
    ],
  }),
  component: ClassesPage,
});

function ClassesPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Classes">
        <ClassesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
