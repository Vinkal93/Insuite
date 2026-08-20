import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentHomeworkListView } from "@/features/parent";

export const Route = createFileRoute("/parent/homework")({
  head: () => ({
    meta: [
      { title: "Homework & Coursework — InSuite Parent Portal" },
      { name: "description", content: "Active assignments, subject tasks, and submission deadlines." },
    ],
  }),
  component: HomeworkPage,
});

function HomeworkPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentHomeworkListView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
