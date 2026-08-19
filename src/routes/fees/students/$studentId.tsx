import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentFeeProfileView } from "@/features/fees";

export const Route = createFileRoute("/fees/students/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Fee Ledger — InSuite" },
      { name: "description", content: "Student fee profile, ledger, and transaction history." },
    ],
  }),
  component: StudentFeeProfilePage,
});

function StudentFeeProfilePage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Student Fee Ledger">
        <StudentFeeProfileView />
      </AppLayout>
    </ProtectedRoute>
  );
}
