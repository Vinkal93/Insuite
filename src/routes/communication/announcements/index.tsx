import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { AnnouncementsListView } from "@/features/communication";

export const Route = createFileRoute("/communication/announcements/")({
  head: () => ({
    meta: [
      { title: "Announcements & Circulars — InSuite" },
      { name: "description", content: "Broadcast school-wide announcements." },
    ],
  }),
  component: AnnouncementsPage,
});

function AnnouncementsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <AnnouncementsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
