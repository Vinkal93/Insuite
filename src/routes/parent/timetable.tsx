import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentTimetableView } from "@/features/parent";

export const Route = createFileRoute("/parent/timetable")({
  head: () => ({
    meta: [
      { title: "Class Timetable — InSuite Parent Portal" },
      { name: "description", content: "Weekly period schedule and classroom allocations." },
    ],
  }),
  component: TimetablePage,
});

function TimetablePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentTimetableView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
