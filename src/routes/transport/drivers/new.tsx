import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateDriverView } from "@/features/transport";

export const Route = createFileRoute("/transport/drivers/new")({
  head: () => ({
    meta: [
      { title: "Onboard Transport Driver — InSuite" },
      { name: "description", content: "Link staff member to commercial driving certification." },
    ],
  }),
  component: CreateDriverPage,
});

function CreateDriverPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateDriverView />
      </AppLayout>
    </ProtectedRoute>
  );
}
