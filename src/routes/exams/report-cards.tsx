import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ReportCardsView } from "@/features/exams";

export const Route = createFileRoute("/exams/report-cards")({
  head: () => ({
    meta: [
      { title: "Student Report Cards — InSuite" },
      { name: "description", content: "Generate and print official student report cards." },
    ],
  }),
  component: ReportCardsPage,
});

function ReportCardsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ReportCardsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
