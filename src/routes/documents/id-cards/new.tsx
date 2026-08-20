import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { GenerateIdCardsView } from "@/features/documents";

export const Route = createFileRoute("/documents/id-cards/new")({
  head: () => ({
    meta: [
      { title: "Generate ID Cards — InSuite" },
      { name: "description", content: "Bulk generate student identification cards." },
    ],
  }),
  component: GenerateIdCardsPage,
});

function GenerateIdCardsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <GenerateIdCardsView />
      </AppLayout>
    </ProtectedRoute>
  );
}
