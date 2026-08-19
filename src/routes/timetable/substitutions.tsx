import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SubstitutionsListView } from "@/features/timetable";

export const Route = createFileRoute("/timetable/substitutions")({
  head: () => ({
    meta: [
      { title: "Teacher Substitutions — InSuite" },
      { name: "description", content: "Faculty substitutions and coverage allocations." },
    ],
  }),
  component: SubstitutionsPage,
});

function SubstitutionsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Substitutions">
        <SubstitutionsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
