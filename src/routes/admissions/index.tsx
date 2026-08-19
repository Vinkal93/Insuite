import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmissionsDashboardView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/")({
  head: () => ({
    meta: [
      { title: "Admissions CRM — InSuite" },
      { name: "description", content: "Track enquiries, applications and admissions from one place." },
    ],
  }),
  component: AdmissionsDashboardPage,
});

function AdmissionsDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Admissions Dashboard">
        <AdmissionsDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
