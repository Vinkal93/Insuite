import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StaffDetailView } from "@/features/hr";

export const Route = createFileRoute("/hr/staff/$staffId/")({
  head: () => ({
    meta: [
      { title: "Staff Profile — InSuite" },
      { name: "description", content: "View full employee dossier." },
    ],
  }),
  component: StaffDetailPage,
});

function StaffDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StaffDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
