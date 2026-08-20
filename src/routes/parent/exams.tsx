import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentExamsListView } from "@/features/parent";

export const Route = createFileRoute("/parent/exams")({
  head: () => ({
    meta: [
      { title: "Exams & Results — InSuite Parent Portal" },
      { name: "description", content: "Published assessment marks and academic report cards." },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentExamsListView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
