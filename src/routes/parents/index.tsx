import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ParentListView } from "@/features/parents";

export const Route = createFileRoute("/parents/")({
  head: () => ({
    meta: [
      { title: "Parent Directory — InSuite" },
      { name: "description", content: "Manage guardian contacts and family units." },
    ],
  }),
  component: ParentsIndexPage,
});

function ParentsIndexPage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="Parent Directory">
        <ParentListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
