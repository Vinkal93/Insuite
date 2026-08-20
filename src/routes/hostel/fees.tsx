import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelFeesView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/fees")({
  head: () => ({
    meta: [
      { title: "Hostel Fees — InSuite" },
      { name: "description", content: "Boarding charges, dues, and payment tracking." },
    ],
  }),
  component: HostelFeesPage,
});

function HostelFeesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelFeesView />
      </AppLayout>
    </ProtectedRoute>
  );
}
