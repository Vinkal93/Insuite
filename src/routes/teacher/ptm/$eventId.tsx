import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherPtmView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/ptm/$eventId")({
  head: () => ({
    meta: [
      { title: "PTM Event Meetings — Teacher Workspace" },
      { name: "description", content: "Faculty event appointments." },
    ],
  }),
  component: TeacherEventPtmPage,
});

function TeacherEventPtmPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherPtmView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
