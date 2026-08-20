import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { VisitorsListView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/visitors/")({
  head: () => ({
    meta: [
      { title: "Visitor Management — InSuite" },
      { name: "description", content: "Campus visitor log and security tracking." },
    ],
  }),
  component: VisitorsListPage,
});

function VisitorsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <VisitorsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
