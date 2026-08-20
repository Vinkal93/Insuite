import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FrontOfficeEnquiriesView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/enquiries/")({
  head: () => ({
    meta: [
      { title: "Admission Enquiries — Front Office — InSuite" },
      { name: "description", content: "Front desk admission inquiries connected with Admissions CRM." },
    ],
  }),
  component: FrontOfficeEnquiriesPage,
});

function FrontOfficeEnquiriesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <FrontOfficeEnquiriesView />
      </AppLayout>
    </ProtectedRoute>
  );
}
