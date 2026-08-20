import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LibrarySettingsView } from "@/features/library";

export const Route = createFileRoute("/library/settings")({
  head: () => ({
    meta: [
      { title: "Library Settings — InSuite" },
      { name: "description", content: "Configure borrowing limits, loan periods, and fine rates." },
    ],
  }),
  component: LibrarySettingsPage,
});

function LibrarySettingsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <LibrarySettingsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
