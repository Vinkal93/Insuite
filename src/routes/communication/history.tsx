import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CommunicationHistoryView } from "@/features/communication";

export const Route = createFileRoute("/communication/history")({
  head: () => ({
    meta: [
      { title: "Communication History & Audit — InSuite" },
      { name: "description", content: "Audit log of all announcements, notices, and messages." },
    ],
  }),
  component: CommunicationHistoryPage,
});

function CommunicationHistoryPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CommunicationHistoryView />
      </AppLayout>
    </ProtectedRoute>
  );
}
