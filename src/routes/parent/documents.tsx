import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentDocumentsView } from "@/features/parent";

export const Route = createFileRoute("/parent/documents")({
  head: () => ({
    meta: [
      { title: "Student Documents & Certificates — Parent Portal" },
      { name: "description", content: "Official school certificates and ID cards for linked children." },
    ],
  }),
  component: ParentDocumentsPage,
});

function ParentDocumentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentDocumentsView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
