import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentDashboardView } from "@/features/parent";

export const Route = createFileRoute("/parent/")({
  head: () => ({
    meta: [
      { title: "Parent Portal Dashboard — InSuite" },
      { name: "description", content: "Student academic summaries, fees, attendance, and homework overview." },
    ],
  }),
  component: ParentDashboardPage,
});

function ParentDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentDashboardView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
