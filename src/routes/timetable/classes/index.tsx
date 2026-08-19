import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ClassTimetableListView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/classes/")({
  validateSearch: (search: Record<string, unknown>): { classId?: string; sectionId?: string } => {
    return {
      classId: (search.classId as string) || undefined,
      sectionId: (search.sectionId as string) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Class Timetables — InSuite" },
      { name: "description", content: "Weekly class and section schedule grid." },
    ],
  }),
  component: ClassTimetablePage,
});

function ClassTimetablePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Class Timetable">
        <ClassTimetableListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
