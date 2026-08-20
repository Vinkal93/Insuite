import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { DocumentTemplateEditorView } from "@/features/documents";

export const Route = createFileRoute("/documents/templates/new")({
  head: () => ({
    meta: [
      { title: "Design Document Template — InSuite" },
      { name: "description", content: "Create a new certificate or ID card template." },
    ],
  }),
  component: CreateTemplatePage,
});

function CreateTemplatePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <DocumentTemplateEditorView />
      </AppLayout>
    </ProtectedRoute>
  );
}
