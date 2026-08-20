import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherPtmView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/ptm/availability")({
  head: () => ({
    meta: [
      { title: "My PTM Availability — Teacher Workspace" },
      { name: "description", content: "Faculty conference availability." },
    ],
  }),
  component: TeacherAvailabilityPtmPage,
});

function TeacherAvailabilityPtmPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherPtmView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
