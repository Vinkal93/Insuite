import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { StaffListView } from "@/features/hr";

export const Route = createFileRoute("/hr/staff/")({
  head: () => ({
    meta: [
      { title: "Staff Directory — InSuite" },
      { name: "description", content: "Faculty and employee directory." },
    ],
  }),
  component: StaffListPage,
});

function StaffListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <StaffListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
