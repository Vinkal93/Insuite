import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentFeesView } from "@/features/student";

export const Route = createFileRoute("/student/fees/")({
  head: () => ({
    meta: [
      { title: "Fee Status — Student Portal" },
      { name: "description", content: "School fee status and invoice breakdown." },
    ],
  }),
  component: StudentFeesPage,
});

function StudentFeesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentFeesView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
