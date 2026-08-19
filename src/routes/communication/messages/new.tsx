import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SendMessageView } from "@/features/communication";

export const Route = createFileRoute("/communication/messages/new")({
  head: () => ({
    meta: [
      { title: "Compose & Dispatch Message — InSuite" },
      { name: "description", content: "Send message across In-App, Email, SMS, or WhatsApp." },
    ],
  }),
  component: SendMessagePage,
});

function SendMessagePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <SendMessageView />
      </AppLayout>
    </ProtectedRoute>
  );
}
