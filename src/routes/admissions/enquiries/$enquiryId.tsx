import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { EnquiryProfileView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/enquiries/$enquiryId")({
  head: () => ({
    meta: [
      { title: "Enquiry Details — InSuite" },
      { name: "description", content: "Enquiry profile and counseling logs." },
    ],
  }),
  component: EnquiryDetailsPage,
});

function EnquiryDetailsPage() {
  const { enquiryId } = useParams({ from: "/admissions/enquiries/$enquiryId" });

  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Enquiry Profile">
        <EnquiryProfileView enquiryId={enquiryId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
