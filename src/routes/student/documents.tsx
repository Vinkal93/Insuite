import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentDocumentsView } from "@/features/student";

export const Route = createFileRoute("/student/documents")({
  head: () => ({
    meta: [
      { title: "My Documents & Certificates — Student Portal" },
      { name: "description", content: "View and print official school certificates and student ID cards." },
    ],
  }),
  component: StudentDocumentsPage,
});

function StudentDocumentsPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentDocumentsView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
