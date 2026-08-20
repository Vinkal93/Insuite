import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentTemplateEditorView } from "@/features/documents";

export const Route = createFileRoute("/documents/templates/$id/edit")({
  head: () => ({
    meta: [
      { title: "Edit Template — InSuite" },
      { name: "description", content: "Edit document template." },
    ],
  }),
  component: EditTemplatePage,
});

function EditTemplatePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentTemplateEditorView />
      </AppLayout>
    </ProtectedRoute>
  );
}
