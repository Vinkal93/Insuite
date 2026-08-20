import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FrontOfficeReportsView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/reports")({
  head: () => ({
    meta: [
      { title: "Front Office Reports — InSuite" },
      { name: "description", content: "Visitor footfall, security logs, and audit reports." },
    ],
  }),
  component: FrontOfficeReportsPage,
});

function FrontOfficeReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <FrontOfficeReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
