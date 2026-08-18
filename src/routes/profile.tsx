import { createFileRoute } from "@tanstack/react-router";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";
import { ProfileView } from "@/features/profile";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — InSuite" },
      { name: "description", content: "View and edit your InSuite user profile." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <ProtectedRoute requireSetupComplete={true}>
      <AppLayout pageTitle="My Profile">
        <ProfileView />
      </AppLayout>
    </ProtectedRoute>
  );
}
