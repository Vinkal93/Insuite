import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StudentPromotionsPlaceholder } from "@/features/students";

export const Route = createFileRoute("/students/promotions")({
  head: () => ({
    meta: [
      { title: "Student Promotions — InSuite" },
      { name: "description", content: "Academic class promotions and batch rollover." },
    ],
  }),
  component: StudentPromotionsPage,
});

function StudentPromotionsPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Student Promotions">
        <StudentPromotionsPlaceholder />
      </AppLayout>
    </ProtectedRoute>
  );
}
