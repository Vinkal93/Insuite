import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TeacherTimetableListView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/teachers/$teacherId")({
  head: () => ({
    meta: [
      { title: "Teacher Schedule — InSuite" },
      { name: "description", content: "Individual faculty schedule and timetable." },
    ],
  }),
  component: TeacherTimetableDetailPage,
});

function TeacherTimetableDetailPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Teacher Timetable">
        <TeacherTimetableListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
