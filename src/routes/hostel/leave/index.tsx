import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { HostelLeaveListView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/leave/")({
  head: () => ({
    meta: [
      { title: "Hostel Leave Requests — InSuite" },
      { name: "description", content: "Authorize student out-passes and weekend leaves." },
    ],
  }),
  component: HostelLeaveListPage,
});

function HostelLeaveListPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <HostelLeaveListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
