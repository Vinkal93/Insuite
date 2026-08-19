import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TeacherDetailView } from "@/features/academics";

export const Route = createFileRoute("/academics/teachers/$teacherId")({
  head: () => ({
    meta: [
      { title: "Teacher Profile — InSuite" },
      { name: "description", content: "View teacher professional profile, assignments, and documents." },
    ],
  }),
  component: TeacherDetailPage,
});

function TeacherDetailPage() {
  const { teacherId } = Route.useParams();

  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Teacher Profile">
        <TeacherDetailView teacherId={teacherId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
