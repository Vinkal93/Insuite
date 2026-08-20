import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentTransportView } from "@/features/parent";

export const Route = createFileRoute("/parent/transport")({
  head: () => ({
    meta: [
      { title: "School Transport — InSuite Parent Portal" },
      { name: "description", content: "Bus route, pickup stops, and vehicle assignments." },
    ],
  }),
  component: TransportPage,
});

function TransportPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentTransportView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
