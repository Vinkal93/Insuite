import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FrontOfficeAppointmentsListView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/appointments/")({
  head: () => ({
    meta: [
      { title: "Appointments — Front Desk — InSuite" },
      { name: "description", content: "Scheduled meetings with school faculty and administration." },
    ],
  }),
  component: AppointmentsPage,
});

function AppointmentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <FrontOfficeAppointmentsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
