import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmissionWaitlistView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/waitlist")({
  head: () => ({
    meta: [
      { title: "Admission Waitlist — InSuite" },
      { name: "description", content: "Prioritized standby queue for oversubscribed classes." },
    ],
  }),
  component: WaitlistPage,
});

function WaitlistPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AdmissionWaitlistView />
      </AppLayout>
    </ProtectedRoute>
  );
}
