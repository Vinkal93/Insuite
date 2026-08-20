import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { VendorsListView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/vendors/")({
  head: () => ({
    meta: [
      { title: "Suppliers & Vendors Directory — InSuite" },
      { name: "description", content: "Procurement partners, equipment manufacturers, and service contractors." },
    ],
  }),
  component: VendorsPage,
});

function VendorsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <VendorsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
