import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { ParentLayout } from "@/layouts/ParentLayout";
import { ParentProfileView } from "@/features/parent";

export const Route = createFileRoute("/parent/profile")({
  head: () => ({
    meta: [
      { title: "Parent Profile — InSuite Parent Portal" },
      { name: "description", content: "Family contact information and student guardianships." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <ProtectedRoute requireSetupComplete>
      <ParentLayout>
        <ParentProfileView />
      </ParentLayout>
    </ProtectedRoute>
  );
}
