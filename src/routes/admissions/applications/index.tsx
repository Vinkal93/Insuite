import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ApplicationsListView } from "@/features/admissions";

export const Route = createFileRoute("/admissions/applications/")({
  head: () => ({
    meta: [
      { title: "Applications — InSuite" },
      { name: "description", content: "Manage student admission applications." },
    ],
  }),
  component: ApplicationsListPage,
});

function ApplicationsListPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Admission Applications">
        <ApplicationsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
