import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DepartmentsListView } from "@/features/hr";

export const Route = createFileRoute("/hr/departments")({
  head: () => ({
    meta: [
      { title: "Departments — InSuite" },
      { name: "description", content: "Academic and operational departments." },
    ],
  }),
  component: DepartmentsPage,
});

function DepartmentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DepartmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
