import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateHostelView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/hostels/new")({
  head: () => ({
    meta: [
      { title: "Create Hostel — InSuite" },
      { name: "description", content: "Add a new boarding hostel." },
    ],
  }),
  component: CreateHostelPage,
});

function CreateHostelPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateHostelView />
      </AppLayout>
    </ProtectedRoute>
  );
}
