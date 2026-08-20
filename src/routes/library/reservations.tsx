import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ReservationsListView } from "@/features/library";

export const Route = createFileRoute("/library/reservations")({
  head: () => ({
    meta: [
      { title: "Book Reservations & Holds — InSuite" },
      { name: "description", content: "Reserve books and manage priority waitlists." },
    ],
  }),
  component: ReservationsPage,
});

function ReservationsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <ReservationsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
