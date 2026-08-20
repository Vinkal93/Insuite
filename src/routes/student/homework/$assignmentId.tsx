import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentHomeworkDetailView } from "@/features/student";

export const Route = createFileRoute("/student/homework/$assignmentId")({
  head: () => ({
    meta: [
      { title: "Assignment Details & Submission — Student Portal" },
      { name: "description", content: "Submit homework file, view instructions, and check grades." },
    ],
  }),
  component: HomeworkDetailPage,
});

function HomeworkDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentHomeworkDetailView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
