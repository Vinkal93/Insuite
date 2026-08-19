import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CommunicationSettingsView } from "@/features/communication";

export const Route = createFileRoute("/communication/settings")({
  head: () => ({
    meta: [
      { title: "Communication Settings — InSuite" },
      { name: "description", content: "Channel configuration, notice numbering, and policies." },
    ],
  }),
  component: CommunicationSettingsPage,
});

function CommunicationSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CommunicationSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
