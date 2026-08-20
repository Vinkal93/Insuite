import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateFrontOfficeAppointmentView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/appointments/new")({
  head: () => ({
    meta: [
      { title: "Schedule Appointment — InSuite" },
      { name: "description", content: "Book an appointment with faculty or staff." },
    ],
  }),
  component: ScheduleAppointmentPage,
});

function ScheduleAppointmentPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateFrontOfficeAppointmentView />
      </AppLayout>
    </ProtectedRoute>
  );
}
