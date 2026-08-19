import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmissionSettingsView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/settings")({
  head: () => ({
    meta: [
      { title: "Admissions Settings — InSuite" },
      { name: "description", content: "Configure admissions numbering, channels and required docs." },
    ],
  }),
  component: AdmissionSettingsPage,
});

function AdmissionSettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Admissions Settings">
        <AdmissionSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
