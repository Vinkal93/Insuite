import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NoticeDetailView } from "@/features/communication";

export const Route = createFileRoute("/communication/notices/$id")({
  head: () => ({
    meta: [
      { title: "Notice Letterhead & Details — InSuite" },
      { name: "description", content: "Official notice print view." },
    ],
  }),
  component: NoticeDetailPage,
});

function NoticeDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <NoticeDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
