import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { PtmCreateEventView } from "@/features/ptm";

export const Route = createFileRoute("/ptm/events/new")({
  head: () => ({
    meta: [
      { title: "Create PTM Event — InSuite" },
      { name: "description", content: "Create a new parent-teacher conference event." },
    ],
  }),
  component: CreatePtmEventPage,
});

function CreatePtmEventPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <PtmCreateEventView />
      </AppLayout>
    </ProtectedRoute>
  );
}
