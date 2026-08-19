import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SubmissionsListView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/grading")({
  head: () => ({
    meta: [
      { title: "Grading Desk — InSuite" },
      { name: "description", content: "Evaluate student assignments and award marks." },
    ],
  }),
  component: GradingPage,
});

function GradingPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Grading Desk">
        <SubmissionsListView onlyNeedsGrading={true} />
      </AppLayout>
    </ProtectedRoute>
  );
}
