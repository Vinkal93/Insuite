import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FrontOfficeDashboardView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/")({
  head: () => ({
    meta: [
      { title: "Front Desk & Reception — InSuite" },
      { name: "description", content: "Front desk visitor tracking, gate passes, calls, and appointments." },
    ],
  }),
  component: FrontOfficeDashboardPage,
});

function FrontOfficeDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <FrontOfficeDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
