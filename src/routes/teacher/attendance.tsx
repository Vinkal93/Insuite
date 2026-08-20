import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { TeacherLayout } from "@/layouts/TeacherLayout";
import { TeacherAttendanceView } from "@/features/teacher";

export const Route = createFileRoute("/teacher/attendance")({
  head: () => ({
    meta: [
      { title: "Take Class Attendance — Teacher Portal" },
      { name: "description", content: "Daily roll call and student attendance marking." },
    ],
  }),
  component: TeacherAttendancePage,
});

function TeacherAttendancePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <TeacherLayout>
        <TeacherAttendanceView />
      </TeacherLayout>
    </ProtectedRoute>
  );
}
