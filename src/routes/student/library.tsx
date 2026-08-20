import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { StudentLayout } from "@/layouts/StudentLayout";
import { StudentLibraryView } from "@/features/student";

export const Route = createFileRoute("/student/library")({
  head: () => ({
    meta: [
      { title: "Library Books — Student Portal" },
      { name: "description", content: "Borrowed books, return dates, and online renewals." },
    ],
  }),
  component: StudentLibraryPage,
});

function StudentLibraryPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <StudentLayout>
        <StudentLibraryView />
      </StudentLayout>
    </ProtectedRoute>
  );
}
