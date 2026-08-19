import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewApplicationForm } from "@/features/admissions";

export const Route = createFileRoute("/admissions/applications/new")({
  head: () => ({
    meta: [
      { title: "New Application — InSuite" },
      { name: "description", content: "Submit new student admission application." },
    ],
  }),
  component: NewApplicationPage,
});

function NewApplicationPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="New Application">
        <NewApplicationForm />
      </AppLayout>
    </ProtectedRoute>
  );
}
