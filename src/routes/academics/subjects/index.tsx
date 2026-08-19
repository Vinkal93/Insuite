import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SubjectsListView } from "@/features/academics";

export const Route = createFileRoute("/academics/subjects/")({
  head: () => ({
    meta: [
      { title: "Subjects & Curriculum — InSuite" },
      { name: "description", content: "Manage school curriculum subjects, syllabus, and evaluation schemes." },
    ],
  }),
  component: SubjectsPage,
});

function SubjectsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Subjects">
        <SubjectsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
