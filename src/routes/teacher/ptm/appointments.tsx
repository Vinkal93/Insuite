import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherPtmView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/ptm/appointments")({
  head: () => ({
    meta: [
      { title: "Teacher PTM Appointments — InSuite" },
      { name: "description", content: "Faculty appointment schedules." },
    ],
  }),
  component: TeacherAppointmentsPtmPage,
});

function TeacherAppointmentsPtmPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherPtmView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
