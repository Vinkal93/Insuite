import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AnnouncementDetailView } from "@/features/communication";

export const Route = createFileRoute("/communication/announcements/$id")({
  head: () => ({
    meta: [
      { title: "Announcement Details — InSuite" },
      { name: "description", content: "View full announcement details." },
    ],
  }),
  component: AnnouncementDetailPage,
});

function AnnouncementDetailPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AnnouncementDetailView />
      </AppLayout>
    </ProtectedRoute>
  );
}
