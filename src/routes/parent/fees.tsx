import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentFeesView } from "@/features/parent";

export const Route = createFileRoute("/parent/fees")({
  head: () => ({
    meta: [
      { title: "Fees & Receipts — InSuite Parent Portal" },
      { name: "description", content: "School invoices, paid receipts, and pending dues." },
    ],
  }),
  component: FeesPage,
});

function FeesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentFeesView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
