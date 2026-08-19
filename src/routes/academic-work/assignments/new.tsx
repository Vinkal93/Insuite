import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateAssignmentView } from "@/features/academicWork";
import type { AssignmentType } from "@/types";

export const Route = createFileRoute("/academic-work/assignments/new")({
  validateSearch: (search: Record<string, unknown>): { type?: AssignmentType } => {
    return {
      type: (search.type as AssignmentType) || undefined,
    };
  },
  head: () => ({
    meta: [
      { title: "Create Assignment — InSuite" },
      { name: "description", content: "Create and publish assignments and learning activities." },
    ],
  }),
  component: CreateAssignmentPage,
});

function CreateAssignmentPage() {
  const search = Route.useSearch();
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Create Assignment">
        <CreateAssignmentView initialType={search.type} />
      </AppLayout>
    </ProtectedRoute>
  );
}
