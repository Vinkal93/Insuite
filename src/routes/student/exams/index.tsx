import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentExamsListView } from "@/features/student";

export const Route = createFileRoute("/student/exams/")({
  head: () => ({
    meta: [
      { title: "Exams & Results — Student Portal" },
      { name: "description", content: "Assessment marks, grades, and report cards." },
    ],
  }),
  component: StudentExamsPage,
});

function StudentExamsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentExamsListView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
