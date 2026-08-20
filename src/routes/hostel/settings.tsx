import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelSettingsView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/settings")({
  head: () => ({
    meta: [
      { title: "Hostel Settings — InSuite" },
      { name: "description", content: "Boarding house configuration, curfew hours, and out-pass rules." },
    ],
  }),
  component: HostelSettingsPage,
});

function HostelSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
