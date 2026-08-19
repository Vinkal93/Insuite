import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NewTeacherView } from "@/features/academics";

export const Route = createFileRoute("/academics/teachers/new")({
  head: () => ({
    meta: [
      { title: "Register New Teacher — InSuite" },
      { name: "description", content: "Add a new faculty member with personal, professional, and document records." },
    ],
  }),
  component: NewTeacherPage,
});

function NewTeacherPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="New Teacher">
        <NewTeacherView />
      </AppLayout>
    </ProtectedRoute>
  );
}
