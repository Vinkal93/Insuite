import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AcademicWorkDashboardView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/")({
  head: () => ({
    meta: [
      { title: "Academic Work Dashboard — InSuite" },
      { name: "description", content: "Create, distribute and evaluate assignments, homework, and classwork." },
    ],
  }),
  component: AcademicWorkDashboardPage,
});

function AcademicWorkDashboardPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Academic Work">
        <AcademicWorkDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
