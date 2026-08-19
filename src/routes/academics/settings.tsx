import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicSettingsView } from "@/features/academics";

export const Route = createFileRoute("/academics/settings")({
  head: () => ({
    meta: [
      { title: "Academic Settings — InSuite" },
      { name: "description", content: "Configure institutional academic settings, grading schemes, and departments." },
    ],
  }),
  component: AcademicSettingsPage,
});

function AcademicSettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Academic Settings">
        <AcademicSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
