import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateNoticeView } from "@/features/communication";

export const Route = createFileRoute("/communication/notices/new")({
  head: () => ({
    meta: [
      { title: "Issue Notice — InSuite" },
      { name: "description", content: "Create official administrative notice." },
    ],
  }),
  component: CreateNoticePage,
});

function CreateNoticePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateNoticeView />
      </AppLayout>
    </ProtectedRoute>
  );
}
