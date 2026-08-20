import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ReceptionTasksView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/tasks")({
  head: () => ({
    meta: [
      { title: "Reception Tasks — InSuite" },
      { name: "description", content: "Front desk operational checklists and action items." },
    ],
  }),
  component: ReceptionTasksPage,
});

function ReceptionTasksPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ReceptionTasksView />
      </AppLayout>
    </ProtectedRoute>
  );
}
