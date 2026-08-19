import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateAnnouncementView } from "@/features/communication";

export const Route = createFileRoute("/communication/announcements/new")({
  head: () => ({
    meta: [
      { title: "Broadcast Announcement — InSuite" },
      { name: "description", content: "Create and publish school announcements." },
    ],
  }),
  component: CreateAnnouncementPage,
});

function CreateAnnouncementPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateAnnouncementView />
      </AppLayout>
    </ProtectedRoute>
  );
}
