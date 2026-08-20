import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentFeesView } from "@/features/student";

export const Route = createFileRoute("/student/fees/receipts")({
  head: () => ({
    meta: [
      { title: "Fee Receipts — Student Portal" },
      { name: "description", content: "Confirmed payment receipts." },
    ],
  }),
  component: StudentReceiptsPage,
});

function StudentReceiptsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentFeesView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
