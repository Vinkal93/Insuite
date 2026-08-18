import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentForm } from "@/features/students";

export const Route = createFileRoute("/students/new")({
  head: () => ({
    meta: [
      { title: "Enroll New Student — InSuite" },
      { name: "description", content: "Register and enroll a new student." },
    ],
  }),
  component: NewStudentPage,
});

function NewStudentPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="New Student Enrollment">
        <StudentForm />
      </AppLayout>
    </ProtectedRoute>
  );
}
