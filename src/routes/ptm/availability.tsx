import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmAvailabilityView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/availability")({
  head: () => ({
    meta: [
      { title: "Teacher PTM Availability — InSuite" },
      { name: "description", content: "Faculty availability across PTM conferences." },
    ],
  }),
  component: PtmAvailabilityPage,
});

function PtmAvailabilityPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmAvailabilityView />
      </AppLayout>
    </ProtectedRoute>
  );
}
