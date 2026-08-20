import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherPtmView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/ptm/")({
  head: () => ({
    meta: [
      { title: "PTM Meetings — Teacher Workspace" },
      { name: "description", content: "Faculty conference bookings and meeting notes." },
    ],
  }),
  component: TeacherPtmPage,
});

function TeacherPtmPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherPtmView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
