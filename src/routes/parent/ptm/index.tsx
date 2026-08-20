import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentPtmView } from "@/features/parent";

export const Route = createFileRoute("/parent/ptm/")({
  head: () => ({
    meta: [
      { title: "Parent-Teacher Meetings — Parent Portal" },
      { name: "description", content: "Book conference slots with teachers." },
    ],
  }),
  component: ParentPtmPage,
});

function ParentPtmPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentPtmView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
