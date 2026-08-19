import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AdmissionDetailView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/admitted/$admissionId")({
  head: () => ({
    meta: [
      { title: "Admission Record — InSuite" },
      { name: "description", content: "Student admission document and enrollment credentials." },
    ],
  }),
  component: AdmissionDetailsPage,
});

function AdmissionDetailsPage() {
  const { admissionId } = useParams({ from: "/admissions/admitted/$admissionId" });

  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Admission Record">
        <AdmissionDetailView admissionId={admissionId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
