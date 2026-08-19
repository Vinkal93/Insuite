import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { SectionsListView } from "@/features/academics";

export const Route = createFileRoute("/academics/sections/")({
  head: () => ({
    meta: [
      { title: "Sections & Classrooms — InSuite" },
      { name: "description", content: "Manage school classroom sections, capacities, and mentors." },
    ],
  }),
  component: SectionsPage,
});

function SectionsPage() {
  return (
    <ProtectedRoute>
      <AppLayout pageTitle="Sections">
        <SectionsListView />
      </AppLayout>
    </ProtectedRoute>
  );
}
