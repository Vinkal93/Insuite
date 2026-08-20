import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmEventDetailView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/events/$eventId")({
  head: () => ({
    meta: [
      { title: "PTM Event Details — InSuite" },
      { name: "description", content: "PTM time slots and booked appointments." },
    ],
  }),
  component: PtmEventDetailPage,
});

function PtmEventDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmEventDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
