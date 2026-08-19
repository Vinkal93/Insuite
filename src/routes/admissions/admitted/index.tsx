import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmittedStudentsView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/admitted/")({
  head: () => ({
    meta: [
      { title: "Admitted Students — InSuite" },
      { name: "description", content: "Finalized student admissions." },
    ],
  }),
  component: AdmittedStudentsPage,
});

function AdmittedStudentsPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Admitted Students">
        <AdmittedStudentsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
