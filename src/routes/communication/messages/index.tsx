import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { MessagesListView } from "@/features/communication";

export const Route = createFileRoute("/communication/messages/")({
  head: () => ({
    meta: [
      { title: "Multi-Channel Outbox — InSuite" },
      { name: "description", content: "View dispatched messages and channel status." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <MessagesListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
