import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmAppointmentsListView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/appointments/$appointmentId")({
  head: () => ({
    meta: [
      { title: "Appointment Details — InSuite" },
      { name: "description", content: "PTM appointment details and meeting notes." },
    ],
  }),
  component: AppointmentDetailPage,
});

function AppointmentDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmAppointmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
