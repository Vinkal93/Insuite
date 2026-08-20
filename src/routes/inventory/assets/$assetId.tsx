import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AssetDetailView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/assets/$assetId")({
  head: () => ({
    meta: [
      { title: "Asset Dossier & Lifecycle — InSuite" },
      { name: "description", content: "Asset specifications, custodian assignment history, transfers, and warranties." },
    ],
  }),
  component: AssetDetailPage,
});

function AssetDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AssetDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
