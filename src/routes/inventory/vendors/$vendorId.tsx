import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { VendorDetailView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/vendors/$vendorId")({
  head: () => ({
    meta: [
      { title: "Vendor Profile & History — InSuite" },
      { name: "description", content: "Vendor contact information, purchase orders, and supplied assets." },
    ],
  }),
  component: VendorDetailPage,
});

function VendorDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <VendorDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
