import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ClassDetailView } from "@/features/academics";

export const Route = createFileRoute("/academics/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class Details — InSuite" },
      { name: "description", content: "View class sections, subjects, students, and faculty." },
    ],
  }),
  component: ClassDetailPage,
});

function ClassDetailPage() {
  const { classId } = Route.useParams();

  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Class Details">
        <ClassDetailView classId={classId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
