import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentChildDetailView } from "@/features/parent";

export const Route = createFileRoute("/parent/children/$studentId")({
  head: () => ({
    meta: [
      { title: "Student Dossier — InSuite Parent Portal" },
      { name: "description", content: "Comprehensive student records, class details, and module shortcuts." },
    ],
  }),
  component: ChildDetailPage,
});

function ChildDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentChildDetailView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
