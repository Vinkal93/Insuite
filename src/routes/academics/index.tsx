import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicDashboardView } from "@/features/academics";

export const Route = createFileRoute("/academics/")({
  head: () => ({
    meta: [
      { title: "Academic Management — InSuite" },
      { name: "description", content: "School academic architecture, classes, subjects, and teachers dashboard." },
    ],
  }),
  component: AcademicDashboardPage,
});

function AcademicDashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Academics">
        <AcademicDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
