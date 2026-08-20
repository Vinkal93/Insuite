import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FrontOfficeSettingsView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/settings")({
  head: () => ({
    meta: [
      { title: "Front Desk Settings — InSuite" },
      { name: "description", content: "Gate pass sequences and security rules." },
    ],
  }),
  component: FrontOfficeSettingsPage,
});

function FrontOfficeSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <FrontOfficeSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
