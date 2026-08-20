import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentHomeworkListView } from "@/features/student";

export const Route = createFileRoute("/student/homework/")({
  head: () => ({
    meta: [
      { title: "Homework & Assignments — Student Portal" },
      { name: "description", content: "Active subject homework, instructions, and due dates." },
    ],
  }),
  component: StudentHomeworkPage,
});

function StudentHomeworkPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentHomeworkListView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
