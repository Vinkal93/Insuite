import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherMarksEntryView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/marks/$examId")({
  head: () => ({
    meta: [
      { title: "Marks Entry Worksheet — Teacher Portal" },
      { name: "description", content: "Enter and save student examination marks." },
    ],
  }),
  component: MarksEntryPage,
});

function MarksEntryPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherMarksEntryView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
