import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmEventsListView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/events/")({
  head: () => ({
    meta: [
      { title: "PTM Events — InSuite" },
      { name: "description", content: "Parent-Teacher meeting event rosters." },
    ],
  }),
  component: PtmEventsPage,
});

function PtmEventsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmEventsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
