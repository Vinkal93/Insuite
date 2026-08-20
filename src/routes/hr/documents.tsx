import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StaffDocumentsView } from "@/features/hr";

export const Route = createFileRoute("/hr/documents")({
  head: () => ({
    meta: [
      { title: "Staff Documents & Compliance — InSuite" },
      { name: "description", content: "Faculty certificates and compliance tracking." },
    ],
  }),
  component: StaffDocumentsPage,
});

function StaffDocumentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StaffDocumentsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
