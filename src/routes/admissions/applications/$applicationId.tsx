import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ApplicationReviewView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/applications/$applicationId")({
  head: () => ({
    meta: [
      { title: "Review Application — InSuite" },
      { name: "description", content: "Review and approve student application." },
    ],
  }),
  component: ApplicationReviewPage,
});

function ApplicationReviewPage() {
  const { applicationId } = useParams({ from: "/admissions/applications/$applicationId" });

  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Review Application">
        <ApplicationReviewView applicationId={applicationId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
