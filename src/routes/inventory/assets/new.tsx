import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateAssetView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/assets/new")({
  head: () => ({
    meta: [
      { title: "Register Fixed Asset — InSuite" },
      { name: "description", content: "Onboard new capital asset, IT equipment, or laboratory device." },
    ],
  }),
  component: CreateAssetPage,
});

function CreateAssetPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateAssetView />
      </AppLayout>
    </ProtectedRoute>
  );
}
