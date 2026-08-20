import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateStaffView } from "@/features/hr";

export const Route = createFileRoute("/hr/staff/new")({
  head: () => ({
    meta: [
      { title: "Register Staff — InSuite" },
      { name: "description", content: "Onboard new employee or faculty." },
    ],
  }),
  component: CreateStaffPage,
});

function CreateStaffPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateStaffView />
      </AppLayout>
    </ProtectedRoute>
  );
}
