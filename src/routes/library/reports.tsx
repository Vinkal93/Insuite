import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LibraryReportsView } from "@/features/library";

export const Route = createFileRoute("/library/reports")({
  head: () => ({
    meta: [
      { title: "Library Reports & Audits — InSuite" },
      { name: "description", content: "Export book inventory, circulation history, and fine audits." },
    ],
  }),
  component: LibraryReportsPage,
});

function LibraryReportsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <LibraryReportsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
