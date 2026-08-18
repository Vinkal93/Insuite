import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentProfileView } from "@/features/students";

export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Profile — InSuite" },
      { name: "description", content: "Student profile and academic records." },
    ],
  }),
  component: StudentDetailsPage,
});

function StudentDetailsPage() {
  const { studentId } = useParams({ from: "/students/$studentId" });

  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Student Profile">
        <StudentProfileView studentId={studentId} />
      </AppLayout>
    </ProtectedRoute>
  );
}
