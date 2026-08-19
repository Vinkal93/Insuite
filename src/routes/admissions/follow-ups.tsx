import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FollowUpsWorkspace } from "@/features/admissions";

export const Route = createFileRoute("/admissions/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — InSuite" },
      { name: "description", content: "Counsellor calls and follow-up tasks." },
    ],
  }),
  component: FollowUpsPage,
});

function FollowUpsPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Follow-ups Workspace">
        <FollowUpsWorkspace />
      </AppLayout>
    </ProtectedRoute>
  );
}
