import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CorrespondenceListView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/correspondence/")({
  head: () => ({
    meta: [
      { title: "Postal & Correspondence — InSuite" },
      { name: "description", content: "Incoming and outgoing mail, couriers, and letters." },
    ],
  }),
  component: CorrespondencePage,
});

function CorrespondencePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CorrespondenceListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
