import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HrSettingsView } from "@/features/hr";

export const Route = createFileRoute("/hr/settings")({
  head: () => ({
    meta: [
      { title: "Staff & HR Settings — InSuite" },
      { name: "description", content: "Configure employee numbering, contracts, and compliance rules." },
    ],
  }),
  component: HrSettingsPage,
});

function HrSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HrSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
