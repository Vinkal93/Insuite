import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmissionCampaignsView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/campaigns")({
  head: () => ({
    meta: [
      { title: "Admission Campaigns — InSuite" },
      { name: "description", content: "Lead acquisition campaigns and channel conversion performance." },
    ],
  }),
  component: CampaignsPage,
});

function CampaignsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AdmissionCampaignsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
