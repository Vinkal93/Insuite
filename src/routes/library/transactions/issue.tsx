import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { IssueBookView } from "@/features/library";

export const Route = createFileRoute("/library/transactions/issue")({
  head: () => ({
    meta: [
      { title: "Issue Book — InSuite" },
      { name: "description", content: "Loan out book copy to student or faculty member." },
    ],
  }),
  component: IssueBookPage,
});

function IssueBookPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <IssueBookView />
      </AppLayout>
    </ProtectedRoute>
  );
}
