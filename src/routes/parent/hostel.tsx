import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentHostelView } from "@/features/parent";

export const Route = createFileRoute("/parent/hostel")({
  head: () => ({
    meta: [
      { title: "Hostel & Residence — Parent Portal — InSuite" },
      { name: "description", content: "Boarding house details, bed allotment, and out-pass requests." },
    ],
  }),
  component: ParentHostelPage,
});

function ParentHostelPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentHostelView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
