import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SectionDetailView } from "@/features/academics";

export const Route = createFileRoute("/academics/sections/$sectionId")({
  head: () => ({
    meta: [
      { title: "Section Details — InSuite" },
      { name: "description", content: "View section students, capacity, and assigned faculty." },
    ],
  }),
  component: SectionDetailPage,
});

function SectionDetailPage() {
  const { sectionId } = Route.useParams();

  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Section Details">
        <SectionDetailView sectionId={sectionId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
