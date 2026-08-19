import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NoticesListView } from "@/features/communication";

export const Route = createFileRoute("/communication/notices/")({
  head: () => ({
    meta: [
      { title: "Institutional Notices — InSuite" },
      { name: "description", content: "Official school circulars and orders." },
    ],
  }),
  component: NoticesPage,
});

function NoticesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <NoticesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
