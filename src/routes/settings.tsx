import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SettingsView } from "@/features/settings";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — InSuite School Management" },
      { name: "description", content: "Configure your InSuite school settings." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Settings">
        <SettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
