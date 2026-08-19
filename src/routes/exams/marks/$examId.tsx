import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { MarksEntryView } from "@/features/exams";

export const Route = createFileRoute("/exams/marks/$examId")({
  head: () => ({
    meta: [
      { title: "Marks Entry — InSuite" },
      { name: "description", content: "Record student subject marks." },
    ],
  }),
  component: MarksEntryExamPage,
});

function MarksEntryExamPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <MarksEntryView />
      </AppLayout>
    </ProtectedRoute>
  );
}
