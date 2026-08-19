import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SubjectDetailView } from "@/features/academics";

export const Route = createFileRoute("/academics/subjects/$subjectId")({
  head: () => ({
    meta: [
      { title: "Subject Details — InSuite" },
      { name: "description", content: "View subject evaluation structure, mapped classes, and faculty." },
    ],
  }),
  component: SubjectDetailPage,
});

function SubjectDetailPage() {
  const { subjectId } = Route.useParams();

  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Subject Details">
        <SubjectDetailView subjectId={subjectId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
