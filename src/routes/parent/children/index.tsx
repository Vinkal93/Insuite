import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentChildrenListView } from "@/features/parent";

export const Route = createFileRoute("/parent/children/")({
  head: () => ({
    meta: [
      { title: "My Children — InSuite Parent Portal" },
      { name: "description", content: "View linked student profiles and academic statuses." },
    ],
  }),
  component: ParentChildrenPage,
});

function ParentChildrenPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentChildrenListView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
