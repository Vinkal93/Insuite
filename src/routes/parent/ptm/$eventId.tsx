import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentPtmView } from "@/features/parent";

export const Route = createFileRoute("/parent/ptm/$eventId")({
  head: () => ({
    meta: [
      { title: "PTM Event Booking — Parent Portal" },
      { name: "description", content: "Select faculty time slot." },
    ],
  }),
  component: ParentEventPtmPage,
});

function ParentEventPtmPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentPtmView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
