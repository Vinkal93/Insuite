import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentMessagesView } from "@/features/student";

export const Route = createFileRoute("/student/messages")({
  head: () => ({
    meta: [
      { title: "Teacher Messages — Student Portal" },
      { name: "description", content: "Direct queries and messages to class faculty." },
    ],
  }),
  component: StudentMessagesPage,
});

function StudentMessagesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentMessagesView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
