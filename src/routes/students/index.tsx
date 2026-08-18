import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentListView } from "@/features/students";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Student Directory — InSuite" },
      { name: "description", content: "Manage students and institutional records." },
    ],
  }),
  component: StudentsIndexPage,
});

function StudentsIndexPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Students Directory">
        <StudentListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
