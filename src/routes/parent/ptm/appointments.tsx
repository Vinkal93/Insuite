import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentPtmView } from "@/features/parent";

export const Route = createFileRoute("/parent/ptm/appointments")({
  head: () => ({
    meta: [
      { title: "My PTM Appointments — Parent Portal" },
      { name: "description", content: "View booked parent-teacher conferences." },
    ],
  }),
  component: ParentAppointmentsPage,
});

function ParentAppointmentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentPtmView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
