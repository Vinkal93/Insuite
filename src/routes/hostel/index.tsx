import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelDashboardView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/")({
  head: () => ({
    meta: [
      { title: "Hostel & Residence — InSuite" },
      { name: "description", content: "Hostel management, room allocations, attendance, and leaves." },
    ],
  }),
  component: HostelDashboardPage,
});

function HostelDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
