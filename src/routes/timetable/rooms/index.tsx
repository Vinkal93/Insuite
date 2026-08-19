import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { RoomTimetableListView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/rooms/")({
  head: () => ({
    meta: [
      { title: "Room & Facility Timetables — InSuite" },
      { name: "description", content: "Classrooms, science labs, computer labs, and auditorium schedules." },
    ],
  }),
  component: RoomTimetablePage,
});

function RoomTimetablePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Room Timetable">
        <RoomTimetableListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
