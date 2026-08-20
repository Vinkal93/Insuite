import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentSettingsView } from "@/features/parent";

export const Route = createFileRoute("/parent/settings")({
  head: () => ({
    meta: [
      { title: "Parent Settings — InSuite Parent Portal" },
      { name: "description", content: "Notification preferences and account credentials." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentSettingsView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
