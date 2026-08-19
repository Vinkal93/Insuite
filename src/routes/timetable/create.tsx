import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateTimetableEntryView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/create")({
  head: () => ({
    meta: [
      { title: "Create Timetable Entry — InSuite" },
      { name: "description", content: "Schedule classroom periods, subjects, teachers, and rooms." },
    ],
  }),
  component: CreateTimetablePage,
});

function CreateTimetablePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Create Timetable">
        <CreateTimetableEntryView />
      </AppLayout>
    </ProtectedRoute>
  );
}
