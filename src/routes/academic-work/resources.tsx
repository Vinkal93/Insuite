import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ResourcesLibraryView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/resources")({
  head: () => ({
    meta: [
      { title: "Academic Resources — InSuite" },
      { name: "description", content: "Teaching materials, worksheets, slides, and reference notes." },
    ],
  }),
  component: ResourcesPage,
});

function ResourcesPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Resources">
        <ResourcesLibraryView />
      </AppLayout>
    </ProtectedRoute>
  );
}
