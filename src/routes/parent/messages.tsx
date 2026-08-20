import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentMessagesView } from "@/features/parent";

export const Route = createFileRoute("/parent/messages")({
  head: () => ({
    meta: [
      { title: "Messages & Inquiries — InSuite Parent Portal" },
      { name: "description", content: "Direct communication with teachers and school administration." },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentMessagesView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
