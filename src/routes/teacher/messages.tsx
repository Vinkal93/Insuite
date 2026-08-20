import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherMessagesView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/messages")({
  head: () => ({
    meta: [
      { title: "Teacher Messages — InSuite" },
      { name: "description", content: "Faculty messaging and communications channel." },
    ],
  }),
  component: TeacherMessagesPage,
});

function TeacherMessagesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherMessagesView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
