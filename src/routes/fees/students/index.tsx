import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentFeesListView } from "@/features/fees";

export const Route = createFileRoute("/fees/students/")({
  head: () => ({
    meta: [
      { title: "Student Fees Directory — InSuite" },
      { name: "description", content: "Student fee invoices and balances." },
    ],
  }),
  component: StudentFeesListPage,
});

function StudentFeesListPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Student Fees">
        <StudentFeesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
