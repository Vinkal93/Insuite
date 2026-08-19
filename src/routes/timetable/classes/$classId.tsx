import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ClassTimetableListView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/classes/$classId")({
  head: () => ({
    meta: [
      { title: "Class Timetable — InSuite" },
      { name: "description", content: "Classroom weekly period schedule." },
    ],
  }),
  component: ClassTimetableDetailPage,
});

function ClassTimetableDetailPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Class Timetable">
        <ClassTimetableListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
