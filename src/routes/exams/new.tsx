import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateExamView } from "@/features/exams";

export const Route = createFileRoute("/exams/new")({
  head: () => ({
    meta: [
      { title: "Create Examination — InSuite" },
      { name: "description", content: "Define a new examination term." },
    ],
  }),
  component: CreateExamPage,
});

function CreateExamPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateExamView />
      </AppLayout>
    </ProtectedRoute>
  );
}
