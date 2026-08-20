import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmSlotsView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/slots")({
  head: () => ({
    meta: [
      { title: "PTM Slots Grid — InSuite" },
      { name: "description", content: "Faculty conference slots." },
    ],
  }),
  component: PtmSlotsPage,
});

function PtmSlotsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmSlotsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
