import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CounsellingWorkspace } from "@/features/admissions";

export const Route = createFileRoute("/admissions/counselling")({
  head: () => ({
    meta: [
      { title: "Counselling — InSuite" },
      { name: "description", content: "Candidate counseling and parent interview logs." },
    ],
  }),
  component: CounsellingPage,
});

function CounsellingPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Counselling Workspace">
        <CounsellingWorkspace />
      </AppLayout>
    </ProtectedRoute>
  );
}
