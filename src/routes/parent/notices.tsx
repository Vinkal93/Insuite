import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentNoticesView } from "@/features/parent";

export const Route = createFileRoute("/parent/notices")({
  head: () => ({
    meta: [
      { title: "School Circulars — InSuite Parent Portal" },
      { name: "description", content: "Official administrative announcements and parent bulletins." },
    ],
  }),
  component: NoticesPage,
});

function NoticesPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentNoticesView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
