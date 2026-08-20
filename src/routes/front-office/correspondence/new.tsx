import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AddCorrespondenceView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/correspondence/new")({
  head: () => ({
    meta: [
      { title: "Log Postal Entry — InSuite" },
      { name: "description", content: "Add new courier or mail record." },
    ],
  }),
  component: AddCorrespondencePage,
});

function AddCorrespondencePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AddCorrespondenceView />
      </AppLayout>
    </ProtectedRoute>
  );
}
