import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CallLogsListView } from "@/features/frontOffice";

export const Route = createFileRoute("/front-office/calls/")({
  head: () => ({
    meta: [
      { title: "Phone Call Logs — InSuite" },
      { name: "description", content: "Reception phone call logbook and follow-ups." },
    ],
  }),
  component: CallsListPage,
});

function CallsListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CallLogsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
