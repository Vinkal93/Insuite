import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmissionReportsView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/reports")({
  head: () => ({
    meta: [
      { title: "Admissions Reports — InSuite" },
      { name: "description", content: "Export enquiries, applications, admissions, and waitlist records." },
    ],
  }),
  component: ReportsPage,
});

function ReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AdmissionReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
