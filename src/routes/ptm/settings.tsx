import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmSettingsView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/settings")({
  head: () => ({
    meta: [
      { title: "PTM Settings — InSuite" },
      { name: "description", content: "PTM booking policies and default parameters." },
    ],
  }),
  component: PtmSettingsPage,
});

function PtmSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
