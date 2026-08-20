import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FinesListView } from "@/features/library";

export const Route = createFileRoute("/library/fines")({
  head: () => ({
    meta: [
      { title: "Library Overdue Fines — InSuite" },
      { name: "description", content: "Collect and waive library overdue fine penalties." },
    ],
  }),
  component: FinesPage,
});

function FinesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <FinesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
