import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TransportSettingsView } from "@/features/transport";

export const Route = createFileRoute("/transport/settings")({
  head: () => ({
    meta: [
      { title: "Transport Settings — InSuite" },
      { name: "description", content: "Configure transport policies, warning days, and telematics telemetry." },
    ],
  }),
  component: TransportSettingsPage,
});

function TransportSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <TransportSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
