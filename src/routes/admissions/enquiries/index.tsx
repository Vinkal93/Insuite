import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { EnquiriesListView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/enquiries/")({
  head: () => ({
    meta: [
      { title: "Enquiries — InSuite" },
      { name: "description", content: "Prospective student inquiries." },
    ],
  }),
  component: EnquiriesListPage,
});

function EnquiriesListPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Admissions Enquiries">
        <EnquiriesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
