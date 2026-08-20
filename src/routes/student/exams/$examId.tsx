import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentExamsListView } from "@/features/student";

export const Route = createFileRoute("/student/exams/$examId")({
  head: () => ({
    meta: [
      { title: "Exam Result Details — Student Portal" },
      { name: "description", content: "Published subject marks and grade breakdown." },
    ],
  }),
  component: ExamResultDetailPage,
});

function ExamResultDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentExamsListView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
