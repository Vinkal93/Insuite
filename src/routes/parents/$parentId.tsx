import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ParentProfileView } from "@/features/parents";

export const Route = createFileRoute("/parents/$parentId")({
  head: () => ({
    meta: [
      { title: "Guardian Profile — InSuite" },
      { name: "description", content: "Guardian profile and connected students." },
    ],
  }),
  component: ParentDetailsPage,
});

function ParentDetailsPage() {
  const { parentId } = useParams({ from: "/parents/$parentId" });

  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Guardian Profile">
        <ParentProfileView parentId={parentId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
