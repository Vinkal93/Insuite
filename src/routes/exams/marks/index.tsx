import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { MarksEntryView } from "@/features/exams";

export const Route = createFileRoute("/exams/marks/")({
  head: () => ({
    meta: [
      { title: "Marks Entry Workspace — InSuite" },
      { name: "description", content: "Record student subject marks and absentees." },
    ],
  }),
  component: MarksEntryPage,
});

function MarksEntryPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <MarksEntryView />
      </AppLayout>
    </ProtectedRoute>
  );
}
