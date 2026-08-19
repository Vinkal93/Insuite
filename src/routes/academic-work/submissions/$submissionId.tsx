import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SubmissionDetailView } from "@/features/academicWork";

export const Route = createFileRoute("/academic-work/submissions/$submissionId")({
  validateSearch: (search: Record<string, unknown>): { assignmentId?: string } => {
    return {
      assignmentId: (search.assignmentId as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Submission Evaluation — InSuite" },
      { name: "description", content: "Review and evaluate student submission." },
    ],
  }),
  component: SubmissionDetailPage,
});

function SubmissionDetailPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Evaluate Submission">
        <SubmissionDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
