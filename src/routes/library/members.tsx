import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { LibraryMembersView } from "@/features/library";

export const Route = createFileRoute("/library/members")({
  head: () => ({
    meta: [
      { title: "Library Members & Borrowers — InSuite" },
      { name: "description", content: "Student and staff library borrower roster." },
    ],
  }),
  component: LibraryMembersPage,
});

function LibraryMembersPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <LibraryMembersView />
      </AppLayout>
    </ProtectedRoute>
  );
}
