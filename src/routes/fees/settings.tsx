import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { FeeSettingsView } from "@/features/fees";

export const Route = createFileRoute("/fees/settings")({
  head: () => ({
    meta: [
      { title: "Fee Settings — InSuite" },
      { name: "description", content: "Configure receipt series, late fee fines, and payment modes." },
    ],
  }),
  component: FeeSettingsPage,
});

function FeeSettingsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Fee Settings">
        <FeeSettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
