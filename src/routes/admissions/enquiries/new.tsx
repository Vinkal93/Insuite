import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewEnquiryForm } from "@/features/admissions";

export const Route = createFileRoute("/admissions/enquiries/new")({
  head: () => ({
    meta: [
      { title: "New Enquiry — InSuite" },
      { name: "description", content: "Add new admission enquiry." },
    ],
  }),
  component: NewEnquiryPage,
});

function NewEnquiryPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="New Enquiry">
        <NewEnquiryForm />
      </AppLayout>
    </ProtectedRoute>
  );
}
