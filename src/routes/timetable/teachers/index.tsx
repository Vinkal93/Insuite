import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { TeacherTimetableListView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/teachers/")({
  validateSearch: (search: Record<string, unknown>): { teacherId?: string } => {
    return {
      teacherId: (search.teacherId as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Teacher Schedules — InSuite" },
      { name: "description", content: "Faculty weekly teaching timetable and periods." },
    ],
  }),
  component: TeacherTimetablePage,
});

function TeacherTimetablePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Teacher Timetable">
        <TeacherTimetableListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
