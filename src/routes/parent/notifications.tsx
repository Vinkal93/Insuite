import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentNotificationsView } from "@/features/parent";

export const Route = createFileRoute("/parent/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — InSuite Parent Portal" },
      { name: "description", content: "Real-time alerts, payment reminders, and circular updates." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentNotificationsView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
