import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicWorkSettingsView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/settings")({
  head: () => ({
    meta: [
      { title: "Academic Work Settings — InSuite" },
      { name: "description", content: "Configure submission policies, grading defaults, and file sizes." },
    ],
  }),
  component: AcademicWorkSettingsPage,
});

function AcademicWorkSettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Academic Work Settings">
        <AcademicWorkSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
