import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherSubmissionsReviewView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/submissions/$assignmentId")({
  head: () => ({
    meta: [
      { title: "Review Submissions — Teacher Portal" },
      { name: "description", content: "Grade student files, enter marks, and return feedback." },
    ],
  }),
  component: SubmissionsReviewPage,
});

function SubmissionsReviewPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherSubmissionsReviewView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
