import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LibraryDashboardView } from "@/features/library";

export const Route = createFileRoute("/library/")({
  head: () => ({
    meta: [
      { title: "Library Dashboard — InSuite" },
      { name: "description", content: "Library inventory, circulation loans, and overdue tracking." },
    ],
  }),
  component: LibraryDashboardPage,
});

function LibraryDashboardPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <LibraryDashboardView />
      </AppLayout>
    </ProtectedRoute>
  );
}
