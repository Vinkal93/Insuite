import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmAppointmentsListView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/appointments/")({
  head: () => ({
    meta: [
      { title: "PTM Appointments — InSuite" },
      { name: "description", content: "Parent-teacher appointment bookings." },
    ],
  }),
  component: PtmAppointmentsPage,
});

function PtmAppointmentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmAppointmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
