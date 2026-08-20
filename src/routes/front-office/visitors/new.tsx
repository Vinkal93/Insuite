import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { RegisterVisitorView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/visitors/new")({
  head: () => ({
    meta: [
      { title: "Check In Visitor — InSuite" },
      { name: "description", content: "Fast visitor registration and gate pass issuance." },
    ],
  }),
  component: RegisterVisitorPage,
});

function RegisterVisitorPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <RegisterVisitorView />
      </AppLayout>
    </ProtectedRoute>
  );
}
