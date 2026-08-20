import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherTimetableView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/timetable")({
  head: () => ({
    meta: [
      { title: "My Timetable — Teacher Portal" },
      { name: "description", content: "Weekly teaching periods and classroom schedule." },
    ],
  }),
  component: TeacherTimetablePage,
});

function TeacherTimetablePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherTimetableView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
