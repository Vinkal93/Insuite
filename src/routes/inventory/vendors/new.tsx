import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateVendorView } from "@/features/inventory";

export const Route = createFileRoute("/inventory/vendors/new")({
  head: () => ({
    meta: [
      { title: "Onboard Vendor — InSuite" },
      { name: "description", content: "Register a new supplier or service contractor." },
    ],
  }),
  component: CreateVendorPage,
});

function CreateVendorPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateVendorView />
      </AppLayout>
    </ProtectedRoute>
  );
}
