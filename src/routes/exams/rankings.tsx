import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { RankingsView } from "@/features/exams";

export const Route = createFileRoute("/exams/rankings")({
  head: () => ({
    meta: [
      { title: "Academic Performance Rankings — InSuite" },
      { name: "description", content: "Class and grade merit rankings." },
    ],
  }),
  component: RankingsPage,
});

function RankingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <RankingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
