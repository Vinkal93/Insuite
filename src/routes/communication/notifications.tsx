import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { NotificationsCenterView } from "@/features/communication";

export const Route = createFileRoute("/communication/notifications")({
  head: () => ({
    meta: [
      { title: "Notification Center — InSuite" },
      { name: "description", content: "View all in-app notifications." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <NotificationsCenterView />
      </AppLayout>
    </ProtectedRoute>
  );
}
