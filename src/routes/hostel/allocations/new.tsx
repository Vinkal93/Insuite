import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { CreateHostelAllocationView } from "@/features/hostel";

export const Route = createFileRoute("/hostel/allocations/new")({
  head: () => ({
    meta: [
      { title: "Allocate Hostel Bed — InSuite" },
      { name: "description", content: "Assign a boarding student to an available room and bed." },
    ],
  }),
  component: CreateHostelAllocationPage,
});

function CreateHostelAllocationPage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <AppLayout>
        <CreateHostelAllocationView />
      </AppLayout>
    </ProtectedRoute>
  );
}
