import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicSessionDetailView } from "@/features/academics";

export const Route = createFileRoute("/academics/sessions/$sessionId")({
  head: () => ({
    meta: [
      { title: "Academic Session Details — InSuite" },
      { name: "description", content: "View academic session classes, statistics, and settings." },
    ],
  }),
  component: AcademicSessionDetailPage,
});

function AcademicSessionDetailPage() {
  const { sessionId } = Route.useParams();

  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Session Details">
        <AcademicSessionDetailView sessionId={sessionId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
